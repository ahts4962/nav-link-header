import type NavLinkHeader from "./main";
import { PinnedNoteContentState, PrefixedLinkState, type ThreeWayLinkState } from "./ui/states";

export const DISPLAY_ORDER_PLACEHOLDER_PERIODIC = "[[p]]";
export const DISPLAY_ORDER_PLACEHOLDER_PROPERTY = "[[P]]";
export const DISPLAY_ORDER_PLACEHOLDER_FOLDER = "[[f]]";

/**
 * A container for item states.
 * This class is used to store, sort, and filter item states.
 */
export class ItemStatesContainer {
  private items: (PrefixedLinkState | ThreeWayLinkState | PinnedNoteContentState)[] = [];
  private sorted = false;

  constructor(private plugin: NavLinkHeader) {}

  /**
   * Returns the items added so far.
   * The items are sorted according to the plugin settings.
   */
  public getItems(): (PrefixedLinkState | ThreeWayLinkState | PinnedNoteContentState)[] {
    if (this.sorted) {
      return this.items;
    }

    // Sort the items.
    const order = [...this.plugin.settings.displayOrderOfLinks];
    const existingSortTags = [...new Set(this.items.map((link) => this.getSortTag(link)))];
    const additionalSortTags = existingSortTags.filter((tag) => !order.includes(tag));
    additionalSortTags.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    order.push(...additionalSortTags);

    this.items.sort((a, b) => {
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
    return this.items;
  }

  /**
   * Adds an item to the container.
   * The item is filtered according to the plugin settings.
   * @param item The item to add.
   */
  public addItem(item: PrefixedLinkState | ThreeWayLinkState | PinnedNoteContentState) {
    // Filter out any prefixed links that have the same destination.
    if (this.plugin.settings.filterDuplicateNotes && item instanceof PrefixedLinkState) {
      const i = this.items.findIndex((l) => {
        return l instanceof PrefixedLinkState && l.link.destination === item.link.destination;
      });
      if (i !== -1) {
        // If the link is already in the list
        const existingPrefix = (this.items[i] as PrefixedLinkState).prefix.label;
        const newPrefix = item.prefix.label;
        const priority = this.plugin.settings.duplicateNoteFilteringPriority;
        const existingIndex = priority.indexOf(existingPrefix);
        const newIndex = priority.indexOf(newPrefix);
        if (existingIndex === -1 && newIndex === -1) {
          if (existingPrefix.localeCompare(newPrefix, undefined, { numeric: true }) > 0) {
            this.items[i] = item;
          } else {
            return;
          }
        } else if (existingIndex === -1) {
          this.items[i] = item;
        } else if (newIndex === -1) {
          return;
        } else {
          if (newIndex < existingIndex) {
            this.items[i] = item;
          } else {
            return;
          }
        }
      } else {
        this.items.push(item);
      }
    } else {
      this.items.push(item);
    }

    this.sorted = false;
  }

  /**
   * Returns the sort tag for the item.
   * The sort tag is the equivalent of strings in `displayOrderOfLinks` setting.
   */
  private getSortTag(item: PrefixedLinkState | ThreeWayLinkState | PinnedNoteContentState): string {
    if (item instanceof PrefixedLinkState || item instanceof PinnedNoteContentState) {
      return item.prefix.label;
    } else {
      if (item.type === "periodic") {
        return DISPLAY_ORDER_PLACEHOLDER_PERIODIC;
      } else if (item.type === "property") {
        return DISPLAY_ORDER_PLACEHOLDER_PROPERTY;
      } else {
        return DISPLAY_ORDER_PLACEHOLDER_FOLDER;
      }
    }
  }
}
