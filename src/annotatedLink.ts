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
  removeCode,
  sanitizeRegexInput,
} from "./utils";

export const exportedForTesting = { constructAnnotationRegex };

export const EMOJI_ANNOTATION_PLACEHOLDER: string = "[[E]]";
const MATCHED_ANNOTATION_PLACEHOLDER: string = "__MATCHED_ANNOTATION__";

/**
 * Manages the annotated links.
 * This class is used to search annotated links and cache the search results.
 */
export class AnnotatedLinksManager extends PluginComponent {
  // The cache object that stores the result of annotated links search (for backlinks only).
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
    if (
      settings.annotationStringsForBacklinks.length > 0 ||
      settings.annotationStringsForCurrentNote.length > 0 ||
      settings.advancedAnnotationStringsForBacklinks.length > 0 ||
      settings.advancedAnnotationStringsForCurrentNote.length > 0
    ) {
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
    this.cache.delete(file.path);
  }

  public override onSettingsChanged(
    previous: NavLinkHeaderSettings,
    current: NavLinkHeaderSettings
  ): void {
    if (
      !this.isActive &&
      (current.annotationStringsForBacklinks.length > 0 ||
        current.annotationStringsForCurrentNote.length > 0 ||
        current.advancedAnnotationStringsForBacklinks.length > 0 ||
        current.advancedAnnotationStringsForCurrentNote.length > 0)
    ) {
      this.isActive = true;
    } else if (
      this.isActive &&
      current.annotationStringsForBacklinks.length === 0 &&
      current.annotationStringsForCurrentNote.length === 0 &&
      current.advancedAnnotationStringsForBacklinks.length === 0 &&
      current.advancedAnnotationStringsForCurrentNote.length === 0
    ) {
      this.isActive = false;
    } else if (this.isActive) {
      const keys: (keyof NavLinkHeaderSettings)[] = [
        "annotationStringsForBacklinks",
        "hideAnnotatedLinkPrefix",
        "advancedAnnotationStringsForBacklinks",
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
    this.cache.delete(filePath);
    for (const m of this.cache.values()) {
      m.delete(filePath);
    }
  }

  /**
   * Searches for annotated links in the content of the backlinks and the current file.
   * @param file The current file to search annotated links for.
   * @returns Returns annotated links asynchronously.
   * @throws {PluginError} Throws if `AnnotatedLinksManager` is deactivated or reset
   *     during the asynchronous operation.
   */
  public async *searchAnnotatedLinks(file: TFile): AsyncGenerator<PrefixedLinkInfo[]> {
    if (!this.isActive) {
      return;
    }

    const buildAnnotationMappings = (
      annotations: string[],
      advanced: { regex: string; prefix: string }[]
    ): { regex: string; prefix: string }[] => [
      ...advanced,
      ...annotations.map((annotation) => ({
        regex: sanitizeRegexInput(annotation),
        prefix: this.plugin.settings.hideAnnotatedLinkPrefix ? "" : MATCHED_ANNOTATION_PLACEHOLDER,
      })),
    ];
    const annotationMappingsForBacklinks = buildAnnotationMappings(
      this.plugin.settings.annotationStringsForBacklinks,
      this.plugin.settings.advancedAnnotationStringsForBacklinks
    );
    const annotationMappingsForCurrentNote = buildAnnotationMappings(
      this.plugin.settings.annotationStringsForCurrentNote,
      this.plugin.settings.advancedAnnotationStringsForCurrentNote
    );

    const allowSpace = this.plugin.settings.allowSpaceAfterAnnotationString;
    const ignoreVariationSelectors = this.plugin.settings.ignoreVariationSelectors;
    const filePath = file.path;
    const backlinks = Object.entries(this.plugin.app.metadataCache.resolvedLinks)
      .filter(([, destinations]) => Object.keys(destinations).includes(file.path))
      .map(([source]) => source);
    const cache = this.cache;

    if (annotationMappingsForCurrentNote.length > 0) {
      const links = await this.searchAnnotatedLinksInCurrentNote(
        file,
        annotationMappingsForCurrentNote,
        allowSpace,
        ignoreVariationSelectors
      );
      if (cache !== this.cache) {
        // The cache has been reset during the asynchronous operation.
        throw new PluginError("AnnotatedLinksManager was reset during operation.");
      }
      if (links.length > 0) {
        yield links;
      }
    }

    if (annotationMappingsForBacklinks.length > 0) {
      for (const backlink of backlinks) {
        const links = await this.searchAnnotatedLinksInBacklink(
          backlink,
          filePath,
          annotationMappingsForBacklinks,
          cache,
          allowSpace,
          ignoreVariationSelectors
        );
        if (cache !== this.cache) {
          // The cache has been reset during the asynchronous operation.
          throw new PluginError("AnnotatedLinksManager was reset during operation.");
        }
        if (links.length > 0) {
          yield links;
        }
      }
    }
  }

  /**
   * Searches for annotated links in the current note.
   * @param file The current file to search annotated links for.
   * @param annotationMappings The annotation mappings to use for searching.
   * @param allowSpace Whether to allow space after the annotation string.
   * @param ignoreVariationSelectors Whether to ignore variation selectors in emoji.
   * @returns An array of matched annotated links.
   *     If no matches are found, an empty array is returned.
   */
  private async searchAnnotatedLinksInCurrentNote(
    file: TFile,
    annotationMappings: { regex: string; prefix: string }[],
    allowSpace: boolean,
    ignoreVariationSelectors: boolean
  ): Promise<PrefixedLinkInfo[]> {
    const filePath = file.path;
    if (!filePath.endsWith(".md")) {
      return [];
    }

    const content = removeCode(await this.plugin.app.vault.cachedRead(file));

    const result: PrefixedLinkInfo[] = [];
    for (const mapping of annotationMappings) {
      const annotationRegex = constructAnnotationRegex(mapping.regex, ignoreVariationSelectors);

      let links = this.searchAnnotatedLinksInContent(
        content,
        filePath,
        annotationRegex,
        allowSpace
      );
      if (mapping.prefix !== MATCHED_ANNOTATION_PLACEHOLDER) {
        links = links.map((link) => {
          return { ...link, prefix: mapping.prefix };
        });
      }
      result.push(...links);
    }

    return result;
  }

  /**
   * Searches for annotated links in the specified backlink file.
   * @param backlinkPath The path of the backlink file.
   * @param filePath The path of the current file.
   * @param annotationMappings The annotation mappings to use for searching.
   * @param cache The cache to use for storing search results.
   * @param allowSpace Whether to allow space after the annotation string.
   * @param ignoreVariationSelectors Whether to ignore variation selectors in emoji.
   * @returns An array of matched annotated links.
   *     If no matches are found, an empty array is returned.
   */
  private async searchAnnotatedLinksInBacklink(
    backlinkPath: string,
    filePath: string,
    annotationMappings: { regex: string; prefix: string }[],
    cache: Map<string, Map<string, Set<string>>>,
    allowSpace: boolean,
    ignoreVariationSelectors: boolean
  ): Promise<PrefixedLinkInfo[]> {
    const cachedResult = cache.get(backlinkPath)?.get(filePath);
    if (cachedResult) {
      return Array.from(cachedResult, (prefix) => {
        return {
          prefix,
          link: { destination: backlinkPath, isExternal: false, isResolved: true, displayText: "" },
        };
      });
    }

    const backlinkFile = this.plugin.app.vault.getFileByPath(backlinkPath);
    if (!backlinkFile) {
      return [];
    }

    const content = removeCode(await this.plugin.app.vault.cachedRead(backlinkFile));

    const prefixes: Set<string> = new Set();
    for (const mapping of annotationMappings) {
      const annotationRegex = constructAnnotationRegex(mapping.regex, ignoreVariationSelectors);

      const links = this.searchAnnotatedLinksInContent(
        content,
        backlinkPath,
        annotationRegex,
        allowSpace
      );

      links.forEach((link) => {
        if (link.link.destination === filePath) {
          if (mapping.prefix === MATCHED_ANNOTATION_PLACEHOLDER) {
            prefixes.add(link.prefix);
          } else {
            prefixes.add(mapping.prefix);
          }
        }
      });
    }

    if (!cache.has(backlinkPath)) {
      cache.set(backlinkPath, new Map());
    }
    cache.get(backlinkPath)!.set(filePath, prefixes);

    return Array.from(prefixes, (prefix) => {
      return {
        prefix,
        link: { destination: backlinkPath, isExternal: false, isResolved: true, displayText: "" },
      };
    });
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
