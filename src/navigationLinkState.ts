export type LinkEventHandler = (target: NavigationLinkState, e: MouseEvent) => void;

/**
 * The state of a NavigationLink.
 */
export class NavigationLinkState {
  public destination: string;
  public isExternal: boolean;
  public displayText: string;
  public resolved: boolean;
  public clickHandler: LinkEventHandler;
  public mouseOverHandler: LinkEventHandler;

  /**
   * @param destination The path to the destination file or the URL of the external link.
   *     If the destination is a file path, it must be normalized beforehand.
   * @param isExternal Whether the destination is an external link.
   * @param displayText The display text of the link.
   * @param resolved Whether the destination path exists (true) or not (false).
   * @param clickHandler The function to call when the link is clicked.
   * @param mouseOverHandler The function to call when the mouse hovers over the link.
   */
  constructor({
    destination,
    isExternal,
    displayText,
    resolved,
    clickHandler,
    mouseOverHandler,
  }: {
    destination: string;
    isExternal: boolean;
    displayText: string;
    resolved: boolean;
    clickHandler: LinkEventHandler;
    mouseOverHandler: LinkEventHandler;
  }) {
    this.destination = destination;
    this.isExternal = isExternal;
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
  constructor({ prefix, link }: { prefix: string; link: NavigationLinkState }) {
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
  public previous: { links: PrefixedLinkState[]; hidden: boolean };
  public next: { links: PrefixedLinkState[]; hidden: boolean };
  public parent: { links: PrefixedLinkState[]; hidden: boolean };
  public delimiters: "full" | "separator" | "none";

  /**
   * @param type The type of the link.
   * @param index The index of the link (e.g. the index of the folder links).
   * @param previous The previous links. If `hidden` is `true`, the link is not displayed.
   *     It is possible that `links` is empty and `hidden` is `false`
   *     (e.g., displaying a placeholder).
   * @param next The next links.
   * @param parent The parent links.
   * @param delimiters The style of delimiters to use.
   *     - "full": < previous | parent | next >
   *     - "separator": previous | parent | next
   *     - "none": previous parent next
   */
  constructor({
    type,
    index = 0,
    previous,
    next,
    parent,
    delimiters = "full",
  }: {
    type: "periodic" | "property" | "folder";
    index?: number;
    previous: { links: PrefixedLinkState[]; hidden: boolean };
    next: { links: PrefixedLinkState[]; hidden: boolean };
    parent: { links: PrefixedLinkState[]; hidden: boolean };
    delimiters?: "full" | "separator" | "none";
  }) {
    this.type = type;
    this.index = index;
    this.previous = previous;
    this.next = next;
    this.parent = parent;
    this.delimiters = delimiters;
  }
}
