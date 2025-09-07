import { type TAbstractFile, TFile } from "obsidian";
import emojiRegex from "emoji-regex-xs";
import type NavLinkHeader from "./main";
import { removeCode, removeEmojiVariationSelectors, sanitizeRegexInput } from "./utils";

export const exportedForTesting = {
  convertAnnotationString,
};

export const EMOJI_ANNOTATION_PLACEHOLDER: string = "[[E]]";

/**
 * Manages the annotated links.
 * This class is used to search annotated links and cache the search results.
 * If the settings related to annotated links are changed, the instance must be re-created.
 */
export class AnnotatedLinksManager {
  // The cache object that stores the result of annotated links search.
  // Cache structure: cache[backlinkFilePath][currentFilePath] = [annotation1, annotation2, ...]
  private cache: Map<string, Map<string, string[]>> = new Map();

  constructor(private plugin: NavLinkHeader) {}

  public onFileDeleted(file: TAbstractFile): void {
    if (!(file instanceof TFile)) {
      return;
    }
    this.removeFileFromCache(file.path);
  }

  public onFileRenamed(file: TAbstractFile, oldPath: string): void {
    if (!(file instanceof TFile)) {
      return;
    }
    this.removeFileFromCache(oldPath);
  }

  public onFileModified(file: TAbstractFile): void {
    if (!(file instanceof TFile)) {
      return;
    }
    this.removeFileFromCache(file.path);
  }

  private removeFileFromCache(filePath: string): void {
    if (this.cache.has(filePath)) {
      this.cache.delete(filePath);
    }
  }

  /**
   * Searches the annotated links from the content of the backlinks of the specified file.
   * @param file Annotated links are searched from the backlinks of this file.
   * @returns Return annotated links asynchronously, one at a time.
   */
  public async *searchAnnotatedLinks(
    file: TFile
  ): AsyncGenerator<{ destinationPath: string; annotation: string }> {
    const backlinks = Object.entries(this.plugin.app.metadataCache.resolvedLinks)
      .filter(([, destinations]) => Object.keys(destinations).includes(file.path))
      .map(([source]) => source);

    // Snapshot the current settings so they remain stable during asynchronous processing.
    const annotationStrings = [...this.plugin.settings!.annotationStrings];
    const allowSpace = this.plugin.settings!.allowSpaceAfterAnnotationString;
    const ignoreVariationSelectors = this.plugin.settings!.ignoreVariationSelectors;

    for (const backlink of backlinks) {
      const cachedResult = this.cache.get(backlink)?.get(file.path);
      if (cachedResult) {
        for (const annotation of cachedResult) {
          yield { destinationPath: backlink, annotation };
        }
        continue;
      }

      const backlinkFile = this.plugin.app.vault.getFileByPath(backlink);
      if (!backlinkFile) {
        continue;
      }

      const content = removeCode(await this.plugin.app.vault.cachedRead(backlinkFile));

      const detectedAnnotations: string[] = [];
      for (const annotation of annotationStrings) {
        const annotationRegex = convertAnnotationString(annotation, ignoreVariationSelectors);

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

        detectedAnnotations.push(matchedAnnotations[0]);
        yield {
          destinationPath: backlink,
          annotation: matchedAnnotations[0],
        };
      }

      if (!this.cache.has(backlink)) {
        this.cache.set(backlink, new Map());
      }
      this.cache.get(backlink)!.set(file.path, detectedAnnotations);
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
   *     If no matches are found, an empty array is returned.
   */
  private searchAnnotatedLinksInContent(
    content: string,
    backlinkFilePath: string,
    filePath: string,
    annotationRegex: string,
    allowSpace: boolean
  ): string[] {
    const optionalSpace = allowSpace ? " ?" : "";
    const searchConfigs = [
      // Wiki style links with annotation.
      {
        regex: new RegExp(
          String.raw`(${annotationRegex})${optionalSpace}!?\[\[([^\[\]]+)\]\]`,
          "gu"
        ),
        extractor: (matchString: string) => {
          return matchString.split(/[|#]/)[0]; // Remove the heading and the display text
        },
      },
      // Markdown style links with annotation.
      {
        regex: new RegExp(
          String.raw`(${annotationRegex})${optionalSpace}!?\[[^\[\]]+\]\(([^\(\)]+)\)`,
          "gu"
        ),
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
          extractor(match[2]),
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
 * Convert the annotation string to a regex pattern.
 */
function convertAnnotationString(input: string, ignoreVariationSelectors: boolean): string {
  input = sanitizeRegexInput(input);

  if (ignoreVariationSelectors) {
    // Remove variation selectors from emoji characters,
    // and then add optional variation selectors after each code point.
    input = input.replace(emojiRegex(), (matched) => {
      return Array.from(removeEmojiVariationSelectors(matched))
        .map((cp) => cp + "[\\uFE0E\\uFE0F]?")
        .join("");
    });
  }

  // Find the sanitized placeholder and replace it with the emoji regex.
  const placeholder = sanitizeRegexInput(sanitizeRegexInput(EMOJI_ANNOTATION_PLACEHOLDER));
  return input.replace(new RegExp(placeholder, "g"), `(?:${emojiRegex().source})`);
}
