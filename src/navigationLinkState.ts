export type LinkEventHandler = (
	target: NavigationLinkState,
	e: MouseEvent
) => void;

/**
 * The state of a NavigationLink.
 */
export class NavigationLinkState {
	public destinationPath: string;
	public displayText: string;
	public resolved: boolean;
	public clickHandler: LinkEventHandler;
	public mouseOverHandler: LinkEventHandler;

	/**
	 * @param destinationPath The path to the destination file. This must be normalized beforehand.
	 * @param displayText The display text of the link.
	 * @param resolved Whether the destination path exists (true) or not (false).
	 * @param clickHandler The function to call when the link is clicked.
	 * @param mouseOverHandler The function to call when the mouse hovers over the link.
	 */
	constructor({
		destinationPath,
		displayText,
		resolved,
		clickHandler,
		mouseOverHandler,
	}: {
		destinationPath: string;
		displayText: string;
		resolved: boolean;
		clickHandler: LinkEventHandler;
		mouseOverHandler: LinkEventHandler;
	}) {
		this.destinationPath = destinationPath;
		this.displayText = displayText;
		this.resolved = resolved;
		this.clickHandler = clickHandler;
		this.mouseOverHandler = mouseOverHandler;
	}
}

/**
 * The state of a PrefixedLink.
 */
export class PrefixedLinkState {
	public prefix: string;
	public link: NavigationLinkState;

	/**
	 * @param prefix The string (typically emoji) placed before the link.
	 * @param link The link.
	 */
	constructor({
		prefix,
		link,
	}: {
		prefix: string;
		link: NavigationLinkState;
	}) {
		this.prefix = prefix;
		this.link = link;
	}
}

/**
 * The state of a ThreeWayLink.
 */
export class ThreeWayLinkState {
	public type: "periodic" | "property" | "folder";
	public index: number;
	public previous: { link?: NavigationLinkState; hidden: boolean };
	public next: { link?: NavigationLinkState; hidden: boolean };
	public parent: { link?: NavigationLinkState; hidden: boolean };

	/**
	 * @param type The type of the link.
	 * @param index The index of the link (e.g. the index of the folder links).
	 * @param previous The previous link. If `hidden` is `true`, the link is not displayed.
	 *     It is possible that `link` is `undefined` and `hidden` is `false`
	 *     (e.g., displaying a placeholder).
	 * @param next The next link.
	 * @param parent The parent link.
	 */
	constructor({
		type,
		index = 0,
		previous,
		next,
		parent,
	}: {
		type: "periodic" | "property" | "folder";
		index?: number;
		previous: { link?: NavigationLinkState; hidden: boolean };
		next: { link?: NavigationLinkState; hidden: boolean };
		parent: { link?: NavigationLinkState; hidden: boolean };
	}) {
		this.type = type;
		this.index = index;
		this.previous = previous;
		this.next = next;
		this.parent = parent;
	}
}
