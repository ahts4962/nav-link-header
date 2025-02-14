import { App, normalizePath, TFile } from "obsidian";

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
			.replace(
				/(`+)(?=[^`])(?:[^\n]|\n[^\n])*?[^`]\1(?=(?:$|[^`]))/gs,
				""
			)
	);
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
 *    the value itself is returned. If the property does not exist, `undefined` is returned.
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
):
	| string
	| number
	| boolean
	| null
	| (string | number | boolean | null)[]
	| undefined {
	const fileCache = app.metadataCache.getFileCache(file);
	if (!fileCache?.frontmatter) {
		return undefined;
	}

	if (!(propertyName in fileCache.frontmatter)) {
		return undefined;
	}

	return fileCache.frontmatter[propertyName] as ReturnType<
		typeof getValuesFromFileProperty
	>;
}
