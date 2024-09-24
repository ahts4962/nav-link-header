/**
 * Represents a value that is loaded asynchronously.
 */
export type AsyncValue<T> = {
	hasValue: boolean;
	value?: T;
};

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
