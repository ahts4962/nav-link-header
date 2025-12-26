import { type TAbstractFile, TFile } from "obsidian";
import emojiRegex from "emoji-regex-xs";
import type NavLinkHeader from "./main";
import type { PrefixedLinkInfo } from "./types";
import { PluginComponent } from "./pluginComponent";
import type { NavLinkHeaderSettings } from "./settings";
import { PluginError } from "./pluginError";
import {
  deepEqual,
  parseMarkdownLinkWithValidation,
  parseWikiLinkWithValidation,
  sanitizeRegexInput,
} from "./utils";

export const exportedForTesting = {
  constructAnnotationRegex,
  removeCode,
};

export const EMOJI_ANNOTATION_PLACEHOLDER: string = "[[E]]";
const MATCHED_ANNOTATION_PLACEHOLDER: string = "__MATCHED_ANNOTATION__";

/**
 * Manages the annotated links.
 * This class is used to search annotated links and cache the search results.
 */
export class AnnotatedLinksManager extends PluginComponent {
  // The cache object that stores the result of annotated links search.
  // Cache structure: cache[backlinkFilePath][currentFilePath] = {prefix1, prefix2, ...}
  private cache: Map<string, Map<string, Set<string>>> = new Map();

  private _isActive: boolean = false;

  public get isActive(): boolean {
    return this._isActive;
  }

  private set isActive(val: boolean) {
    if (this._isActive && !val) {
      // Create a new Map instead of clearing the existing one
      // to avoid issues with ongoing asynchronous iterations.
      this.cache = new Map();
    }
    this._isActive = val;
  }

  constructor(private plugin: NavLinkHeader) {
    super();

    const settings = this.plugin.settings;
    if (settings.annotationStrings.length > 0 || settings.advancedAnnotationStrings.length > 0) {
      this.isActive = true;
    }
  }

  public override onFileDeleted(file: TAbstractFile): void {
    if (!this.isActive || !(file instanceof TFile)) {
      return;
    }
    this.removeFileFromCache(file.path);
  }

  public override onFileRenamed(file: TAbstractFile, oldPath: string): void {
    if (!this.isActive || !(file instanceof TFile)) {
      return;
    }
    this.removeFileFromCache(oldPath);
  }

  public override onFileModified(file: TAbstractFile): void {
    if (!this.isActive || !(file instanceof TFile)) {
      return;
    }
    this.removeFileFromCache(file.path);
  }

  public override onSettingsChanged(
    previous: NavLinkHeaderSettings,
    current: NavLinkHeaderSettings
  ): void {
    if (
      !this.isActive &&
      (current.annotationStrings.length > 0 || current.advancedAnnotationStrings.length > 0)
    ) {
      this.isActive = true;
    } else if (
      this.isActive &&
      current.annotationStrings.length === 0 &&
      current.advancedAnnotationStrings.length === 0
    ) {
      this.isActive = false;
    } else if (this.isActive) {
      const keys: (keyof NavLinkHeaderSettings)[] = [
        "annotationStrings",
        "hideAnnotatedLinkPrefix",
        "advancedAnnotationStrings",
        "allowSpaceAfterAnnotationString",
        "ignoreVariationSelectors",
      ];
      if (keys.some((key) => !deepEqual(previous[key], current[key]))) {
        this.cache = new Map();
      }
    }
  }

  public override dispose(): void {
    this.isActive = false;
  }

  private removeFileFromCache(filePath: string): void {
    if (this.cache.has(filePath)) {
      this.cache.delete(filePath);
    }
  }

  /**
   * Searches for annotated links in the content of the backlinks of the specified file.
   * @param file Annotated links are searched from the backlinks of this file.
   * @returns Returns annotated links asynchronously.
   * @throws {PluginError} Throws if `AnnotatedLinksManager` is deactivated or reset
   *     during the asynchronous operation.
   */
  public async *searchAnnotatedLinks(file: TFile): AsyncGenerator<PrefixedLinkInfo[]> {
    if (!this.isActive) {
      return;
    }

    const backlinks = Object.entries(this.plugin.app.metadataCache.resolvedLinks)
      .filter(([, destinations]) => Object.keys(destinations).includes(file.path))
      .map(([source]) => source);

    const annotationMappings = [...this.plugin.settings.advancedAnnotationStrings];
    this.plugin.settings.annotationStrings.forEach((annotation) => {
      const sanitized = sanitizeRegexInput(annotation);
      if (this.plugin.settings.hideAnnotatedLinkPrefix) {
        annotationMappings.push({ regex: sanitized, prefix: "" });
      } else {
        // Use the matched string as the prefix.
        annotationMappings.push({ regex: sanitized, prefix: MATCHED_ANNOTATION_PLACEHOLDER });
      }
    });
    const allowSpace = this.plugin.settings.allowSpaceAfterAnnotationString;
    const ignoreVariationSelectors = this.plugin.settings.ignoreVariationSelectors;

    const cache = this.cache;

    for (const backlink of backlinks) {
      const cachedResult = cache.get(backlink)?.get(file.path);
      if (cachedResult) {
        yield Array.from(cachedResult, (prefix) => {
          return {
            prefix,
            link: { destination: backlink, isExternal: false, isResolved: true, displayText: "" },
          };
        });
        continue;
      }

      const backlinkFile = this.plugin.app.vault.getFileByPath(backlink);
      if (!backlinkFile) {
        continue;
      }

      const content = removeCode(await this.plugin.app.vault.cachedRead(backlinkFile));
      if (cache !== this.cache) {
        // The cache has been reset during the asynchronous operation.
        throw new PluginError("AnnotatedLinksManager was reset during operation.");
      }

      const prefixes: Set<string> = new Set();
      for (const mapping of annotationMappings) {
        const annotationRegex = constructAnnotationRegex(mapping.regex, ignoreVariationSelectors);

        const links = this.searchAnnotatedLinksInContent(
          content,
          backlink,
          annotationRegex,
          allowSpace
        );

        links.forEach((link) => {
          if (link.link.destination === file.path) {
            if (mapping.prefix === MATCHED_ANNOTATION_PLACEHOLDER) {
              prefixes.add(link.prefix);
            } else {
              prefixes.add(mapping.prefix);
            }
          }
        });
      }

      if (!cache.has(backlink)) {
        cache.set(backlink, new Map());
      }
      cache.get(backlink)!.set(file.path, prefixes);

      yield Array.from(prefixes, (prefix) => {
        return {
          prefix,
          link: { destination: backlink, isExternal: false, isResolved: true, displayText: "" },
        };
      });
    }
  }

  /**
   * Searches for annotated links in the given content.
   * @param content The content to search in.
   * @param filePath The path of the file containing the content.
   * @param annotationRegex The regex pattern of the annotation string.
   * @param allowSpace Whether to allow space after the annotation string.
   * @returns An array of matched annotated links.
   *     If no matches are found or `annotationRegex` is invalid, an empty array is returned.
   */
  private searchAnnotatedLinksInContent(
    content: string,
    filePath: string,
    annotationRegex: string,
    allowSpace: boolean
  ): PrefixedLinkInfo[] {
    const optionalSpace = allowSpace ? " ?" : "";
    let wikiRegex;
    let markdownRegex;
    try {
      wikiRegex = new RegExp(
        String.raw`(${annotationRegex})${optionalSpace}!?(\[\[[^[\]]+\]\])`,
        "gu"
      );
      markdownRegex = new RegExp(
        String.raw`(${annotationRegex})${optionalSpace}!?(\[[^[\]]+\]\([^()]+\))`,
        "gu"
      );
    } catch {
      return [];
    }

    const result: PrefixedLinkInfo[] = [];

    for (const match of content.matchAll(wikiRegex)) {
      const { path, displayText } = parseWikiLinkWithValidation(
        this.plugin.app,
        filePath,
        match[match.length - 1]
      );
      if (path === undefined) {
        continue;
      }
      result.push({
        prefix: match[1],
        link: {
          destination: path,
          isExternal: false,
          isResolved: true,
          displayText: displayText ?? "",
        },
      });
    }

    for (const match of content.matchAll(markdownRegex)) {
      const { destination, isValidExternalLink, displayText } = parseMarkdownLinkWithValidation(
        this.plugin.app,
        filePath,
        match[match.length - 1]
      );
      if (destination === undefined) {
        continue;
      }
      result.push({
        prefix: match[1],
        link: {
          destination,
          isExternal: isValidExternalLink,
          isResolved: true,
          displayText: displayText ?? "",
        },
      });
    }

    return result;
  }
}

/**
 * Removes YAML front matter, code blocks, and inline code from the text.
 * @param text The text to remove code from.
 * @returns The text without code.
 */
function removeCode(text: string): string {
  return (
    text
      // Removes YAML front matter.
      .replace(/^---\n(?:.*?\n)?---(?:$|\n)/s, "")
      // Removes code blocks (leaves the last line break for the processing of inline code).
      .replace(/^ *(```+)[^`\n]*\n(?:.*?\n)? *\1`* *$/gms, "")
      .replace(/(^|\n) *```+[^`\n]*(?:$|\n.*$)/s, "$1")
      // Removes inline code.
      .replace(/(`+)(?=[^`])(?:[^\n]|\n[^\n])*?[^`]\1(?=(?:$|[^`]))/gs, "")
  );
}

/**
 * Constructs a regex pattern corresponding to the annotation.
 */
function constructAnnotationRegex(baseRegex: string, ignoreVariationSelectors: boolean): string {
  if (ignoreVariationSelectors) {
    // Remove variation selectors from emoji characters,
    // and then add optional variation selectors after each code point.
    baseRegex = baseRegex.replace(emojiRegex(), (matched) => {
      const removed = matched.replace(/[\uFE0E\uFE0F]/gu, "");
      return Array.from(removed)
        .map((cp) => cp + "[\\uFE0E\\uFE0F]?")
        .join("");
    });
  }

  // Find the sanitized placeholder and replace it with the emoji regex.
  const placeholder = sanitizeRegexInput(sanitizeRegexInput(EMOJI_ANNOTATION_PLACEHOLDER));
  return baseRegex.replace(new RegExp(placeholder, "g"), `(?:${emojiRegex().source})`);
}
