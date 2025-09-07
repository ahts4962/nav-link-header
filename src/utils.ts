import { type App, type TFile } from "obsidian";

/**
 * Compares two values and returns `true` if these values are equal.
 * For arrays and objects, the comparison is recursive.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

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

  if (keysA.length !== keysB.length) {
    return false;
  }

  return keysA.every(
    (key) =>
      keysB.includes(key) &&
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
}

/**
 * Deeply copies an object. Applicable only to serializable objects.
 */
export function deepCopy<T>(object: T): T {
  return JSON.parse(JSON.stringify(object)) as T;
}

/**
 * Retrieves the file stem (filename without its final extension) from a normalized path.
 * @param path The path to the file. This must be normalized beforehand.
 * @returns The file stem (filename without its final extension) of the file.
 */
export function getFileStemFromPath(path: string): string {
  return path.split("/").pop()!.split(".").slice(0, -1).join(".");
}

/**
 * If `file` is included in `folder`, returns `true`.
 * @param filePath The path to the file. This must be normalized beforehand.
 * @param folderPath The path to the folder. This must be normalized beforehand.
 * @param recursive If `true`, checks subfolders of `folder` recursively.
 */
export function isFileInFolder(
  filePath: string,
  folderPath: string,
  recursive: boolean = true
): boolean {
  if (recursive) {
    if (folderPath === "/") {
      return true;
    } else {
      return filePath.startsWith(folderPath + "/");
    }
  } else {
    const index = filePath.lastIndexOf("/");
    if (folderPath === "/") {
      return index === -1;
    } else {
      return folderPath === filePath.substring(0, index);
    }
  }
}

/**
 * Joins two paths.
 * @param path1 The first path to join. This must be normalized beforehand.
 * @param path2 The second path to join. This must be normalized beforehand.
 */
export function joinPaths(path1: string, path2: string): string {
  if (path1 === "/") {
    return path2;
  } else if (path2 === "/") {
    return path1;
  } else {
    return path1 + "/" + path2;
  }
}

/**
 * Removes YAML front matter, code blocks, and inline code from the text.
 * @param text The text to remove code from.
 * @returns The text without code.
 */
export function removeCode(text: string): string {
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
 * Removes variation selectors used in emojis from the text.
 * @param text The text to remove variation selectors from.
 * @returns The text without variation selectors.
 */
export function removeEmojiVariationSelectors(text: string): string {
  return text.replace(/[\uFE0E\uFE0F]/gu, "");
}

/**
 * Escapes special characters in a string for use in a regular expression.
 */
export function sanitizeRegexInput(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parses a single Obsidian-style wiki link of the form [[path#header|display]] and
 * extracts the target file path (without the header fragment) and optional display (alias) text.
 * @param text Raw text potentially containing a wiki link
 *     (must be exactly the link, no surrounding text).
 * @returns An object with:
 *     - path?: string — The trimmed target path without any header fragment,
 *       or `undefined` if not a wiki link.
 *     - displayText?: string — The trimmed alias text, or `undefined`
 *       if not present or not a wiki link.
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
 * Parses a single Markdown-style link of the canonical form: [display](destination).
 *
 * Supports:
 * - External links (e.g. https://, http://, etc.)
 * - Internal links (relative Obsidian vault paths), optionally with a header fragment (#section)
 * External links are validated via `URL.canParse()`, and if validation fails,
 * the link is treated as an internal link.
 * @param text Raw text potentially containing a Markdown-style link
 *     (must be exactly the link, no surrounding text).
 * @returns An object with:
 *     - destination?: string — For external links: the trimmed URL as written.
 *       For internal links: the decoded, trimmed target path with any header fragment removed.
 *       Internal paths are otherwise returned verbatim and may not be normalized.
 *       `undefined` if not a markdown link or if an internal link fails to decode.
 *     - isValidExternalLink: boolean — `true` only when destination was recognized as a valid URL.
 *     - displayText?: string — Trimmed display portion. `undefined` if not a markdown link.
 */
export function parseMarkdownLink(text: string): {
  destination?: string;
  isValidExternalLink: boolean;
  displayText?: string;
} {
  text = text.trim();
  const re = /^\[([^\]]+)\]\(([^)]+)\)$/;
  const match = text.match(re);
  if (!match) {
    return {
      destination: undefined,
      isValidExternalLink: false,
      displayText: undefined,
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
      displayText: undefined,
    };
  }
  return { destination, isValidExternalLink: false, displayText };
}

/**
 * Retrieves the string values of a specified property from the front matter of a file.
 * @param app The application instance.
 * @param file The file to retrieve the property from.
 * @param propertyName The name of the property to retrieve.
 * @returns The values of the specified property. Values other than strings are not included.
 *     If the property does not exist, an empty array is returned.
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

  return propertyValues.filter((v) => typeof v === "string");
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

  if (propertyValues.length === 0) {
    return undefined;
  } else {
    return propertyValues[0];
  }
}

/**
 * Retrieves the values of a specified property from the front matter of a file.
 * @param app The application instance.
 * @param file The file to retrieve the property from.
 * @param propertyName The name of the property to retrieve.
 * @returns The values of the specified property.
 *     If the value is not an array, an array containing the value is returned.
 *     If the property does not exist, `undefined` is returned.
 */
function getValuesFromFileProperty(
  app: App,
  file: TFile,
  propertyName: string
): (string | number | boolean | null)[] | undefined {
  const fileCache = app.metadataCache.getFileCache(file);
  if (!fileCache?.frontmatter) {
    return undefined;
  }

  if (!(propertyName in fileCache.frontmatter)) {
    return undefined;
  }

  const propertyValues = fileCache.frontmatter[propertyName] as
    | string
    | number
    | boolean
    | null
    | (string | number | boolean | null)[];
  return Array.isArray(propertyValues) ? propertyValues : [propertyValues];
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

  // When the Web viewer plugin is enabled, `window.open()` opens the URL in a new Obsidian window.
  // This is not Obsidian's default behavior when an external link is clicked.
  // Therefore, the process branches depending on whether the Web viewer plugin is enabled or not.
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
