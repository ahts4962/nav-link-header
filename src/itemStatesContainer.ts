import type NavLinkHeader from "./main";
import {
  CollapsedItemState,
  PinnedNoteContentState,
  PrefixedLinkState,
  PrefixState,
  ThreeWayLinkState,
  type PrefixEventHandler,
} from "./ui/states";

export const DISPLAY_ORDER_PLACEHOLDER_PERIODIC = "[[p]]";
export const DISPLAY_ORDER_PLACEHOLDER_PROPERTY = "[[P]]";
export const DISPLAY_ORDER_PLACEHOLDER_FOLDER = "[[f]]";

/**
 * A container for item states.
 * This class is used to store, sort, and filter item states.
 */
export class ItemStatesContainer {
  private items: (PrefixedLinkState | ThreeWayLinkState | PinnedNoteContentState)[] = [];

  constructor(private plugin: NavLinkHeader) {}

  /**
   * Returns the items added so far.
   * The items are collapsed and sorted according to the plugin settings.
   */
  public getItems(): (
    | PrefixedLinkState
    | ThreeWayLinkState
    | PinnedNoteContentState
    | CollapsedItemState
  )[] {
    const items = this.getCollapsedItemStates();
    const order = [...this.plugin.settings.displayOrderOfLinks];
    const existingSortTags = [...new Set(items.map((link) => getSortTag(link)))];
    const additionalSortTags = existingSortTags.filter((tag) => !order.includes(tag));
    additionalSortTags.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    order.push(...additionalSortTags);

    items.sort((a, b) => {
      const aSortTag = getSortTag(a);
      const bSortTag = getSortTag(b);
      const sortTagComp = order.indexOf(aSortTag) - order.indexOf(bSortTag);
      if (sortTagComp !== 0) {
        return sortTagComp;
      }

      const typeComp = getLinkTypeOrder(a) - getLinkTypeOrder(b);
      if (typeComp !== 0) {
        return typeComp;
      }

      if (a instanceof ThreeWayLinkState && b instanceof ThreeWayLinkState) {
        return a.index - b.index;
      } else if (a instanceof PrefixedLinkState && b instanceof PrefixedLinkState) {
        return a.link.displayText.localeCompare(b.link.displayText, undefined, {
          numeric: true,
        });
      } else {
        return 0;
      }
    });

    return items;
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
  }

  /**
   * Returns the item states after collapsing items according to the plugin settings.
   */
  private getCollapsedItemStates(): (
    | PrefixedLinkState
    | ThreeWayLinkState
    | PinnedNoteContentState
    | CollapsedItemState
  )[] {
    const itemCollapsePrefixes = [...new Set(this.plugin.settings.itemCollapsePrefixes)].filter(
      (prefix) => prefix.length > 0
    );
    if (itemCollapsePrefixes.length === 0) {
      return [...this.items];
    }

    const items = this.items.map((item) => {
      if (item instanceof ThreeWayLinkState) {
        // Deep copy ThreeWayLinkState to modify its links array.
        return new ThreeWayLinkState({
          type: item.type,
          index: item.index,
          previous: {
            links: [...item.previous.links],
            hidden: item.previous.hidden,
          },
          next: {
            links: [...item.next.links],
            hidden: item.next.hidden,
          },
          parent: {
            links: [...item.parent.links],
            hidden: item.parent.hidden,
          },
          delimiters: item.delimiters,
        });
      } else {
        return item;
      }
    });
    const collapsedItems: CollapsedItemState[] = [];
    const prefixClickHandler: PrefixEventHandler = (target) => {
      const label = target.label;
      const prefixes = this.plugin.settingsUnderChange.itemCollapsePrefixes;
      if (prefixes.includes(label)) {
        this.plugin.settingsUnderChange.itemCollapsePrefixes = prefixes.filter((p) => p !== label);
        this.plugin.triggerSettingsChanged();
      }
    };

    for (const prefix of itemCollapsePrefixes) {
      let count = 0;
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (item instanceof PrefixedLinkState || item instanceof PinnedNoteContentState) {
          if (item.prefix.label === prefix) {
            count++;
            items.splice(i, 1);
          }
        } else {
          // ThreeWayLinkState
          [item.previous, item.next, item.parent].forEach((link) => {
            for (let j = link.links.length - 1; j >= 0; j--) {
              if (link.links[j].prefix.label === prefix) {
                count++;
                link.links.splice(j, 1);
              }
            }
          });
        }
      }

      if (count > 0) {
        collapsedItems.push(
          new CollapsedItemState({
            prefix: new PrefixState({ label: prefix, clickHandler: prefixClickHandler }),
            itemCount: count,
          })
        );
      }
    }

    return [...items, ...collapsedItems];
  }
}

/**
 * Returns the sort tag for the item.
 * The sort tag is the equivalent of strings in `displayOrderOfLinks` setting.
 */
function getSortTag(
  item: PrefixedLinkState | ThreeWayLinkState | PinnedNoteContentState | CollapsedItemState
): string {
  if (
    item instanceof PrefixedLinkState ||
    item instanceof PinnedNoteContentState ||
    item instanceof CollapsedItemState
  ) {
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

/**
 * Returns the order index for the item type.
 */
function getLinkTypeOrder(
  item: PrefixedLinkState | ThreeWayLinkState | PinnedNoteContentState | CollapsedItemState
): number {
  if (item instanceof ThreeWayLinkState) {
    return 0;
  } else if (item instanceof PrefixedLinkState) {
    return 1;
  } else if (item instanceof PinnedNoteContentState) {
    return 2;
  } else {
    return 3;
  }
}
