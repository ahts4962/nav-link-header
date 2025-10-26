import { type TAbstractFile, TFile } from "obsidian";
import emojiRegex from "emoji-regex-xs";
import type NavLinkHeader from "./main";
import { PluginComponent } from "./pluginComponent";
import type { NavLinkHeaderSettings } from "./settings";
import { deepEqual, PluginError, sanitizeRegexInput } from "./utils";

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
  // Cache structure: cache[backlinkFilePath][currentFilePath] = [prefix1, prefix2, ...]
  private cache: Map<string, Map<string, string[]>> = new Map();

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
   * @returns Returns annotated links asynchronously, one at a time.
   * @throws {PluginError} Throws if `AnnotatedLinksManager` is deactivated or reset
   *     during the asynchronous operation.
   */
  public async *searchAnnotatedLinks(
    file: TFile
  ): AsyncGenerator<{ destinationPath: string; prefix: string }> {
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
        annotationMappings.unshift({ regex: sanitized, prefix: "" });
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
        for (const prefix of cachedResult) {
          yield { destinationPath: backlink, prefix };
        }
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

      const detectedAnnotations: string[] = [];
      for (const mapping of annotationMappings) {
        const annotationRegex = constructAnnotationRegex(mapping.regex, ignoreVariationSelectors);

        const matchedAnnotations = this.searchAnnotatedLinksInContent(
          content,
          backlink,
          file.path,
          annotationRegex,
          allowSpace
        );
        if (matchedAnnotations.length === 0) {
          continue;
        }

        const matchedAnnotation =
          mapping.prefix === MATCHED_ANNOTATION_PLACEHOLDER
            ? matchedAnnotations[0]
            : mapping.prefix;

        detectedAnnotations.push(matchedAnnotation);
        yield {
          destinationPath: backlink,
          prefix: matchedAnnotation,
        };
      }

      if (!cache.has(backlink)) {
        cache.set(backlink, new Map());
      }
      cache.get(backlink)!.set(file.path, detectedAnnotations);
    }
  }

  /**
   * Helper function for `searchAnnotatedLinks`.
   * @param content The content to search in.
   * @param backlinkFilePath The path of the backlink file (the file containing `content`).
   * @param filePath The path of the file (searches for links to this file in `content`).
   * @param annotationRegex The regex pattern of the annotation string.
   * @param allowSpace Whether to allow space after the annotation string.
   * @returns An array of matched annotation strings.
   *     If no matches are found or `annotationRegex` is invalid, an empty array is returned.
   */
  private searchAnnotatedLinksInContent(
    content: string,
    backlinkFilePath: string,
    filePath: string,
    annotationRegex: string,
    allowSpace: boolean
  ): string[] {
    const optionalSpace = allowSpace ? " ?" : "";
    let wikiRegex: RegExp | undefined = undefined;
    let markdownRegex: RegExp | undefined = undefined;
    try {
      // Wiki style links with annotation.
      wikiRegex = new RegExp(
        String.raw`(${annotationRegex})${optionalSpace}!?\[\[([^\[\]]+)\]\]`,
        "gu"
      );

      // Markdown style links with annotation.
      markdownRegex = new RegExp(
        String.raw`(${annotationRegex})${optionalSpace}!?\[[^\[\]]+\]\(([^\(\)]+)\)`,
        "gu"
      );
    } catch {
      return [];
    }

    const searchConfigs = [
      {
        regex: wikiRegex,
        extractor: (matchString: string) => {
          return matchString.split(/[|#]/)[0]; // Remove the heading and the display text
        },
      },
      {
        regex: markdownRegex,
        extractor: (matchString: string) => {
          matchString = matchString.split("#")[0]; // Remove the heading
          try {
            return decodeURIComponent(matchString);
          } catch {
            return matchString; // Fallback to raw string if decoding fails.
          }
        },
      },
    ];

    const matchedAnnotations: string[] = [];
    for (const { regex, extractor } of searchConfigs) {
      for (const match of content.matchAll(regex)) {
        const matchedPath = this.plugin.app.metadataCache.getFirstLinkpathDest(
          extractor(match[match.length - 1]),
          backlinkFilePath
        )?.path;
        if (matchedPath === filePath) {
          matchedAnnotations.push(match[1]);
        }
      }
    }

    return matchedAnnotations;
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
