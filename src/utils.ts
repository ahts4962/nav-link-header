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

export class Debouncer {
	private timer?: number;

	/**
	 * @param delay The delay in milliseconds.
	 */
	constructor(private delay: number) {}

	public run(action: () => void): void {
		if (this.timer) {
			window.clearTimeout(this.timer);
		}
		this.timer = window.setTimeout(action, this.delay);
	}

	public cancel(): void {
		if (this.timer) {
			window.clearTimeout(this.timer);
		}
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
