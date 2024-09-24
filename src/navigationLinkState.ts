import { getTitleFromPath } from "./utils";

export type LinkEventHandler = (
	target: NavigationLinkState,
	e: MouseEvent
) => void;

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

	/**
	 * @param enabled If `false`, this object does not represent a valid navigation link,
	 *     and the other properties are ignored.
	 * @param destinationPath The path to the destination file. This must be normalized beforehand.
	 * @param fileExists Whether the destination file exists in the vault.
	 * @param annotation The annotation string.
	 */
	constructor({
		enabled,
		destinationPath,
		fileExists,
		annotation,
		clickHandler,
		mouseOverHandler,
	}: {
		enabled: boolean;
		destinationPath?: string;
		fileExists?: boolean;
		annotation?: string;
		clickHandler?: LinkEventHandler;
		mouseOverHandler?: LinkEventHandler;
	}) {
		this.enabled = enabled;
		this.destinationPath = destinationPath;
		this.fileExists = fileExists;
		this.annotation = annotation;
		this.clickHandler = clickHandler;
		this.mouseOverHandler = mouseOverHandler;
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
