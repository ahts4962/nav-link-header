import { normalizePath } from "obsidian";

/**
 * Represents a value that is loaded asynchronously.
 */
export type AsyncValue<T> = {
	hasValue: boolean;
	value?: T;
};

/**
 * Represents an error specific to this plugin.
 */
export class NavLinkHeaderError extends Error {
	constructor(message?: string) {
		super(message);
		this.name = new.target.name;
	}
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
 */
export function fileIncludedInFolder(file: string, folder: string): boolean {
	if (folder === "/") {
		return true;
	} else {
		return file.startsWith(folder + "/");
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
