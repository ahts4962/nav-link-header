import { normalizePath, type App, type TFile } from "obsidian";
import emojiRegex from "emoji-regex-xs";

/**
 * Compares two values and returns `true` if these values are equal.
 * For arrays and objects, the comparison is recursive.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(
    (key) =>
      keysB.includes(key) &&
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
}

/**
 * Deeply copies an object.
 * Applicable only to serializable objects.
 * @param object The object to clone.
 * @returns The cloned object.
 */
export function deepCopy<T>(object: T): T {
  return JSON.parse(JSON.stringify(object)) as T;
}

/**
 * Retrieves the title of a file from a path.
 * @param path The path to the file. This must be normalized beforehand.
 * @returns The title of the file. The extension is not included.
 */
export function getTitleFromPath(path: string): string {
  return path.split("/").pop()!.split(".").slice(0, -1).join(".");
}

/**
 * If `file` is included in `folder` or its subfolders, returns `true`.
 * @param file The path to the file. This must be normalized beforehand.
 * @param folder The path to the folder. This must be normalized beforehand.
 * @param recursive Whether to check subfolders of `folder`.
 */
export function fileIncludedInFolder(
  file: string,
  folder: string,
  recursive: boolean = true
): boolean {
  if (recursive) {
    if (folder === "/") {
      return true;
    } else {
      return file.startsWith(folder + "/");
    }
  } else {
    const index = file.lastIndexOf("/");
    if (folder === "/") {
      return index === -1;
    } else {
      return folder === file.substring(0, index);
    }
  }
}

/**
 * @param path1 The first path to join. Normalization is not required.
 * @param path2 The second path to join. Normalization is not required.
 */
export function joinPaths(path1: string, path2: string): string {
  const normalized1 = normalizePath(path1);
  const normalized2 = normalizePath(path2);
  if (normalized1 === "/") {
    return normalized2;
  } else if (normalized2 === "/") {
    return normalized1;
  } else {
    return normalized1 + "/" + normalized2;
  }
}

/**
 * Removes YAML front matter, code blocks and inline code from the note content.
 * @param content The content to remove code from.
 * @returns The content without code.
 */
export function removeCode(content: string): string {
  return (
    content
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
 * Removes variation selectors from the text.
 * @param textInput The text to remove variation selectors from.
 * @returns The text without variation selectors.
 */
export function removeVariationSelectors(textInput: string): string {
  return textInput.replace(/[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/gu, "");
}

/**
 * Generates a regex pattern for matching emojis.
 * @returns The regex pattern for matching emojis.
 */
export function generateEmojiRegexPattern(): string {
  return emojiRegex().source;
}

/**
 * Parses a wiki link.
 * @param text The text to parse (in the format of "[[path#header|display]]").
 * @returns The path and display text of the wiki link.
 *     If the text is not a wiki link, `path` is `undefined`.
 *     If the display text is not specified, `displayText` is `undefined`.
 *     `path` and `displayText` are trimmed, but `path` is not normalized.
 */
export function parseWikiLink(text: string): {
  path?: string;
  displayText?: string;
} {
  text = text.trim();
  const re = /^\[\[([^[\]]+)\]\]$/;
  const match = text.match(re);
  if (!match) {
    return { path: undefined, displayText: undefined };
  }
  text = match[1];

  let path: string;
  let displayText: string | undefined;

  const i = text.indexOf("|");
  if (i === -1) {
    path = text;
    displayText = undefined;
  } else {
    path = text.slice(0, i);
    displayText = text.slice(i + 1);
  }

  path = path.split("#")[0];

  return { path: path.trim(), displayText: displayText?.trim() };
}

/**
 * Parses a markdown style link.
 * Both internal links and external links are supported.
 * @param text The text to parse (in the format of "[display](some%20note#header)" for
 *     internal links, or "[display](https://example.com)" for external links).
 * @returns The destination, a boolean value indicating whether it is a valid external link,
 *     and display text.
 *     If the text is not a markdown style link, `destination` is `undefined`.
 *     If the text is a valid external link, the text is returned as `destination` without decoding.
 *     If the text is not a valid external link, the text is considered an internal link,
 *     and the text excluding the header part is returned as `destination` (after decoding).
 *     `destination` and `displayText` are trimmed, but `destination` is not normalized
 *     if it is an internal link.
 */
export function parseMarkdownLink(text: string): {
  destination?: string;
  isValidExternalLink: boolean;
  displayText: string;
} {
  text = text.trim();
  const re = /^\[([^\]]+)\]\(([^)]+)\)$/;
  const match = text.match(re);
  if (!match) {
    return {
      destination: undefined,
      isValidExternalLink: false,
      displayText: "",
    };
  }

  const displayText = match[1].trim();
  let destination = match[2].trim();
  const isValidExternalLink = URL.canParse(destination);

  if (isValidExternalLink) {
    return { destination, isValidExternalLink, displayText };
  }

  destination = destination.split("#")[0];
  try {
    destination = decodeURIComponent(destination);
  } catch {
    return {
      destination: undefined,
      isValidExternalLink: false,
      displayText: "",
    };
  }
  return { destination, isValidExternalLink: false, displayText };
}

/**
 * Retrieves the string values of a specified property from the front matter of a file.
 * @param app The application instance.
 * @param file The file to retrieve the property from.
 * @param propertyName The name of the property to retrieve.
 * @returns The values of the specified property. If the property does not exist,
 *     an empty array is returned.
 *     Values other than strings are not included.
 */
export function getStringValuesFromFileProperty(
  app: App,
  file: TFile,
  propertyName: string
): string[] {
  const propertyValues = getValuesFromFileProperty(app, file, propertyName);
  if (propertyValues === undefined) {
    return [];
  }

  if (Array.isArray(propertyValues)) {
    return propertyValues.filter((v) => typeof v === "string");
  } else if (typeof propertyValues === "string") {
    return [propertyValues];
  } else {
    return [];
  }
}

/**
 * Retrieves the first value of a specified property from the front matter of a file.
 * @param app The application instance.
 * @param file The file to retrieve the property from.
 * @param propertyName The name of the property to retrieve.
 * @returns The first value of the specified property. If the property value is not an array,
 *     the value itself is returned. If the property does not exist, `undefined` is returned.
 */
export function getFirstValueFromFileProperty(
  app: App,
  file: TFile,
  propertyName: string
): string | number | boolean | null | undefined {
  const propertyValues = getValuesFromFileProperty(app, file, propertyName);
  if (propertyValues === undefined) {
    return undefined;
  }

  if (Array.isArray(propertyValues)) {
    return propertyValues[0];
  } else {
    return propertyValues;
  }
}

/**
 * Retrieves the values of a specified property from the front matter of a file.
 * @param app The application instance.
 * @param file The file to retrieve the property from.
 * @param propertyName The name of the property to retrieve.
 * @returns The values of the specified property. If the property does not exist,
 *     `undefined` is returned.
 */
function getValuesFromFileProperty(
  app: App,
  file: TFile,
  propertyName: string
): string | number | boolean | null | (string | number | boolean | null)[] | undefined {
  const fileCache = app.metadataCache.getFileCache(file);
  if (!fileCache?.frontmatter) {
    return undefined;
  }

  if (!(propertyName in fileCache.frontmatter)) {
    return undefined;
  }

  return fileCache.frontmatter[propertyName] as ReturnType<typeof getValuesFromFileProperty>;
}

/**
 * Opens an external link in a web viewer leaf if the Web viewer plugin is enabled,
 * or in a default browser otherwise.
 * @param app The application instance.
 * @param url The URL to open.
 * @param newLeaf Whether to open the link in a new leaf.
 */
export async function openExternalLink(app: App, url: string, newLeaf: boolean): Promise<void> {
  let webViewerEnabled = false;
  if (
    "internalPlugins" in app &&
    isObject(app.internalPlugins) &&
    "plugins" in app.internalPlugins &&
    isObject(app.internalPlugins.plugins) &&
    "webviewer" in app.internalPlugins.plugins &&
    isObject(app.internalPlugins.plugins.webviewer)
  ) {
    const webViewerPlugin = app.internalPlugins.plugins.webviewer;
    if (
      "enabled" in webViewerPlugin &&
      webViewerPlugin.enabled === true &&
      "instance" in webViewerPlugin &&
      isObject(webViewerPlugin.instance) &&
      "options" in webViewerPlugin.instance &&
      isObject(webViewerPlugin.instance.options) &&
      "openExternalURLs" in webViewerPlugin.instance.options &&
      webViewerPlugin.instance.options.openExternalURLs === true
    ) {
      webViewerEnabled = true;
    }
  }

  // When the Web viewer plugin is enabled, `window.open()` opens
  // the URL in a new Obsidian window. This is not Obsidian's default behavior
  // when an external link is clicked. Therefore, the process branches
  // depending on whether the Web viewer plugin is enabled or not.
  if (webViewerEnabled) {
    const leaf = app.workspace.getLeaf(newLeaf);
    await leaf.setViewState({
      type: "webviewer",
      state: {
        url: url,
        navigate: true,
      },
      active: true,
    });
  } else {
    window.open(url);
  }
}

/**
 * Checks if the value is an `object`.
 * @param value The value to check.
 * @returns `true` if the value is an `object`.
 */
function isObject(value: unknown): value is object {
  return value !== null && typeof value === "object";
}
