import type NavLinkHeader from "./main";
import { PrefixedLinkState, type ThreeWayLinkState } from "./navigationLinkState";

export const DISPLAY_ORDER_PLACEHOLDER_PERIODIC = "[[p]]";
export const DISPLAY_ORDER_PLACEHOLDER_PROPERTY = "[[P]]";
export const DISPLAY_ORDER_PLACEHOLDER_FOLDER = "[[f]]";

/**
 * A container for links.
 * This class is used to store, sort, and filter links.
 */
export class LinkContainer {
  private links: (PrefixedLinkState | ThreeWayLinkState)[] = [];

  constructor(private plugin: NavLinkHeader) {}

  /**
   * Returns the links added so far.
   */
  public getLinks() {
    return this.links;
  }

  /**
   * Adds a link to the container.
   * The link is filtered and sorted according to the plugin settings.
   * @param link The link to add.
   */
  public addLink(link: PrefixedLinkState | ThreeWayLinkState) {
    // Filter out any prefixed links that have the same destination.
    if (this.plugin.settings.filterDuplicateNotes && link instanceof PrefixedLinkState) {
      const i = this.links.findIndex((l) => {
        return l instanceof PrefixedLinkState && l.link.destination === link.link.destination;
      });
      if (i !== -1) {
        // If the link is already in the list
        const existingPrefix = (this.links[i] as PrefixedLinkState).prefix;
        const newPrefix = link.prefix;
        const priority = this.plugin.settings.duplicateNoteFilteringPriority;
        const existingIndex = priority.indexOf(existingPrefix);
        const newIndex = priority.indexOf(newPrefix);
        if (existingIndex === -1 && newIndex === -1) {
          if (existingPrefix.localeCompare(newPrefix, undefined, { numeric: true }) > 0) {
            this.links[i] = link;
          } else {
            return;
          }
        } else if (existingIndex === -1) {
          this.links[i] = link;
        } else if (newIndex === -1) {
          return;
        } else {
          if (newIndex < existingIndex) {
            this.links[i] = link;
          } else {
            return;
          }
        }
      } else {
        this.links.push(link);
      }
    } else {
      this.links.push(link);
    }

    // Sort the links.
    const order = [...this.plugin.settings.displayOrderOfLinks];
    [
      DISPLAY_ORDER_PLACEHOLDER_PERIODIC,
      DISPLAY_ORDER_PLACEHOLDER_PROPERTY,
      DISPLAY_ORDER_PLACEHOLDER_FOLDER,
    ].forEach((tag) => {
      if (!order.includes(tag)) {
        order.push(tag);
      }
    });
    this.links.sort((a, b) => {
      const aSortTag = this.getSortTag(a);
      const bSortTag = this.getSortTag(b);
      const aIndex = order.indexOf(aSortTag);
      const bIndex = order.indexOf(bSortTag);
      if (aIndex === -1 && bIndex === -1) {
        if (aSortTag === bSortTag) {
          return (a as PrefixedLinkState).link.displayText.localeCompare(
            (b as PrefixedLinkState).link.displayText,
            undefined,
            { numeric: true }
          );
        } else {
          return aSortTag.localeCompare(bSortTag, undefined, { numeric: true });
        }
      } else if (aIndex === -1) {
        return 1;
      } else if (bIndex === -1) {
        return -1;
      } else {
        if (aIndex === bIndex) {
          if (aSortTag === DISPLAY_ORDER_PLACEHOLDER_FOLDER) {
            return (a as ThreeWayLinkState).index - (b as ThreeWayLinkState).index;
          } else {
            return (a as PrefixedLinkState).link.displayText.localeCompare(
              (b as PrefixedLinkState).link.displayText,
              undefined,
              { numeric: true }
            );
          }
        } else {
          return aIndex - bIndex;
        }
      }
    });
  }

  /**
   * Returns the sort tag for the link.
   * The sort tag is the equivalent of strings in `displayOrderOfLinks` setting.
   */
  private getSortTag(link: PrefixedLinkState | ThreeWayLinkState): string {
    if (link instanceof PrefixedLinkState) {
      return link.prefix;
    } else {
      if (link.type === "periodic") {
        return DISPLAY_ORDER_PLACEHOLDER_PERIODIC;
      } else if (link.type === "property") {
        return DISPLAY_ORDER_PLACEHOLDER_PROPERTY;
      } else {
        return DISPLAY_ORDER_PLACEHOLDER_FOLDER;
      }
    }
  }
}
