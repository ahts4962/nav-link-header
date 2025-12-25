/**
 * Represents the direction in a three-way link.
 */
export type ThreeWayDirection = "previous" | "next" | "parent";

/**
 * Represents information about a link.
 *
 * @param destination The URL or path the link points to.
 * @param isExternal Whether the link is external (`true`) or internal (`false`).
 * @param isResolved Whether the link destination exists (`true`) or not (`false`).
 * @param displayText The text to be displayed for the link.
 */
export interface LinkInfo {
  destination: string;
  isExternal: boolean;
  isResolved: boolean;
  displayText: string;
}

/**
 * Represents a link with an associated prefix (e.g., an emoji).
 */
export interface PrefixedLinkInfo {
  prefix: string;
  link: LinkInfo;
}

/**
 * The interface representing a part of note content including links and text.
 * Each note content consists of a prefix (e.g., an emoji) and an array of content items.
 * Each content item can be either a string (plain text) or an object representing a link.
 */
export interface NoteContentInfo {
  prefix: string;
  content: (LinkInfo | string)[];
}
