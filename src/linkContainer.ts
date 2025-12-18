import type NavLinkHeader from "./main";
import {
  PinnedNoteContentState,
  PrefixedLinkState,
  type ThreeWayLinkState,
} from "./navigationLinkState";

export const DISPLAY_ORDER_PLACEHOLDER_PERIODIC = "[[p]]";
export const DISPLAY_ORDER_PLACEHOLDER_PROPERTY = "[[P]]";
export const DISPLAY_ORDER_PLACEHOLDER_FOLDER = "[[f]]";

/**
 * A container for links.
 * This class is used to store, sort, and filter links.
 */
export class LinkContainer {
  private links: (PrefixedLinkState | ThreeWayLinkState | PinnedNoteContentState)[] = [];
  private sorted = false;

  constructor(private plugin: NavLinkHeader) {}

  /**
   * Returns the links added so far.
   * The links are sorted according to the plugin settings.
   */
  public getLinks(): (PrefixedLinkState | ThreeWayLinkState | PinnedNoteContentState)[] {
    if (this.sorted) {
      return this.links;
    }

    // Sort the links.
    const order = [...this.plugin.settings.displayOrderOfLinks];
    const existingSortTags = [...new Set(this.links.map((link) => this.getSortTag(link)))];
    const additionalSortTags = existingSortTags.filter((tag) => !order.includes(tag));
    additionalSortTags.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    order.push(...additionalSortTags);

    this.links.sort((a, b) => {
      const aSortTag = this.getSortTag(a);
      const bSortTag = this.getSortTag(b);
      const aIndex = order.indexOf(aSortTag);
      const bIndex = order.indexOf(bSortTag);
      if (aIndex === bIndex) {
        if (aSortTag === DISPLAY_ORDER_PLACEHOLDER_FOLDER) {
          return (a as ThreeWayLinkState).index - (b as ThreeWayLinkState).index;
        } else if (a instanceof PrefixedLinkState && b instanceof PrefixedLinkState) {
          return a.link.displayText.localeCompare(b.link.displayText, undefined, {
            numeric: true,
          });
        } else if (a instanceof PrefixedLinkState && b instanceof PinnedNoteContentState) {
          return -1;
        } else if (b instanceof PrefixedLinkState && a instanceof PinnedNoteContentState) {
          return 1;
        } else {
          return 0;
        }
      } else {
        return aIndex - bIndex;
      }
    });

    this.sorted = true;
    return this.links;
  }

  /**
   * Adds a link to the container.
   * The link is filtered according to the plugin settings.
   * @param link The link to add.
   */
  public addLink(link: PrefixedLinkState | ThreeWayLinkState | PinnedNoteContentState) {
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

    this.sorted = false;
  }

  /**
   * Returns the sort tag for the link.
   * The sort tag is the equivalent of strings in `displayOrderOfLinks` setting.
   */
  private getSortTag(link: PrefixedLinkState | ThreeWayLinkState | PinnedNoteContentState): string {
    if (link instanceof PrefixedLinkState || link instanceof PinnedNoteContentState) {
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
