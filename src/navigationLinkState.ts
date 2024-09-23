import { getTitleFromPath } from "./utils";

/**
 * Represents a state of the `NavigationLink`.
 */
export class NavigationLinkState {
	/**
	 * Creates a new instance.
	 * @param destinationPath The path to the file to which the `NavigationLink` points.
	 *     This must be normalized beforehand.
	 * @param fileExists Whether the destination file exists in the vault.
	 * @param clickHandler The click event handler.
	 * @param mouseOverHandler The mouse over event handler.
	 * @param annotation The annotation string.
	 */
	constructor(
		public destinationPath: string,
		public fileExists: boolean = true,
		public clickHandler: (
			target: NavigationLinkState,
			e: MouseEvent
		) => void,
		public mouseOverHandler: (
			target: NavigationLinkState,
			e: MouseEvent
		) => void,
		public annotation?: string
	) {}

	/**
	 * The title of the destination file. The extension is not included.
	 */
	public get title(): string {
		return getTitleFromPath(this.destinationPath);
	}
}
