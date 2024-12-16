import { getTitleFromPath } from "./utils";

export type LinkEventHandler = (
	target: NavigationLinkState,
	e: MouseEvent
) => void;

export type PeriodicNoteLinkStates = {
	previous: NavigationLinkState;
	next: NavigationLinkState;
	up: NavigationLinkState;
};

/**
 * Represents a state of the `NavigationLink`.
 */
export class NavigationLinkState {
	public enabled: boolean;
	public destinationPath?: string;
	public fileExists?: boolean;
	public annotation?: string;
	public clickHandler?: LinkEventHandler;
	public mouseOverHandler?: LinkEventHandler;
	public isPropertyLink?: boolean;

	/**
	 * @param enabled If `false`, this object does not represent a valid navigation link,
	 *     and the other properties are ignored.
	 * @param destinationPath The path to the destination file. This must be normalized beforehand.
	 * @param fileExists Whether the destination file exists in the vault.
	 * @param annotation The annotation string.
	 * @param isPropertyLink Whether this link is extracted from a property.
	 */
	constructor({
		enabled,
		destinationPath,
		fileExists,
		annotation,
		clickHandler,
		mouseOverHandler,
		isPropertyLink,
	}: {
		enabled: boolean;
		destinationPath?: string;
		fileExists?: boolean;
		annotation?: string;
		clickHandler?: LinkEventHandler;
		mouseOverHandler?: LinkEventHandler;
		isPropertyLink?: boolean;
	}) {
		this.enabled = enabled;
		this.destinationPath = destinationPath;
		this.fileExists = fileExists;
		this.annotation = annotation;
		this.clickHandler = clickHandler;
		this.mouseOverHandler = mouseOverHandler;
		this.isPropertyLink = isPropertyLink;
	}

	/**
	 * The title of the destination file. The extension is not included.
	 */
	public get title(): string {
		return this.destinationPath
			? getTitleFromPath(this.destinationPath)
			: "";
	}
}
