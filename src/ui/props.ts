import type { LinkInfo, ThreeWayDirection } from "src/types";

export type LinkEventHandler = (target: LinkProps, e: MouseEvent) => void;
export type PrefixEventHandler = (target: PrefixProps) => void;
export type RawNavigationItemProps = PrefixedLinkProps | ThreeWayLinkProps | NoteContentProps;
export type NavigationItemProps =
  | PrefixedLinkProps
  | PrefixedMultiLinkProps
  | ThreeWayLinkProps
  | NoteContentProps
  | CollapsedItemProps;
export type ThreeWayContentProps = PrefixedLinkProps | PrefixedMultiLinkProps;

/**
 * The styles of delimiters for three-way links.
 *   - "full": `< previous | parent | next >`
 *   - "full-double-separator": `< previous || parent || next >`
 *   - "separator": `previous | parent | next`
 *   - "double-separator": `previous || parent || next`
 *   - "none": `previous parent next`
 */
export type ThreeWayDelimiters =
  | "full"
  | "full-double-separator"
  | "separator"
  | "double-separator"
  | "none";

/**
 * The properties of a `Link` component.
 */
export interface LinkProps {
  linkInfo: LinkInfo;
  clickHandler: LinkEventHandler;
  mouseOverHandler: LinkEventHandler;
}

/**
 * The properties of a `Prefix` component.
 */
export interface PrefixProps {
  label: string;
  clickHandler: PrefixEventHandler;
}

/**
 * The properties of a `PrefixedLink` component.
 */
export interface PrefixedLinkProps {
  type: "prefixed-link";
  prefix: PrefixProps;
  link: LinkProps;
}

/**
 * The properties of a `PrefixedMultiLink` component.
 */
export interface PrefixedMultiLinkProps {
  type: "prefixed-multi-link";
  prefix: PrefixProps;
  links: LinkProps[];
}

/**
 * The properties of a `ThreeWayLink` component.
 * @param index The index of the link (e.g., the index of the folder links).
 * @param links The previous/next/parent links.
 *     If `hidden` is `true`, the link is not displayed.
 *     It is possible that `links` is empty and `hidden` is `false`
 *     (e.g., displaying a placeholder).
 * @param delimiters The style of delimiters to use.
 */
export interface ThreeWayLinkProps {
  type: "three-way-link";
  source: "periodic" | "property" | "folder";
  index: number;
  links: Record<ThreeWayDirection, { links: ThreeWayContentProps[]; hidden: boolean }>;
  delimiters: ThreeWayDelimiters;
}

/**
 * The properties of a `NoteContent` component.
 * @param prefix The prefix placed before the note content.
 * @param content The content of the note, which can include links and strings.
 */
export interface NoteContentProps {
  type: "note-content";
  prefix: PrefixProps;
  content: (LinkProps | string)[];
}

/**
 * The properties of a `CollapsedItem` component.
 * @param prefix The prefix placed before the collapsed item.
 * @param itemCount The number of items that are collapsed.
 */
export interface CollapsedItemProps {
  type: "collapsed-item";
  prefix: PrefixProps;
  itemCount: number;
}
