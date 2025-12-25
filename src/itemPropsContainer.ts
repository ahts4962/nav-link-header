import type NavLinkHeader from "./main";
import type {
  CollapsedItemProps,
  NavigationItemProps,
  NavigationItemPropsWithoutCollapsed,
  PrefixedLinkProps,
  PrefixEventHandler,
  ThreeWayLinkProps,
} from "./ui/props";

export const DISPLAY_ORDER_PLACEHOLDER_PERIODIC = "[[p]]";
export const DISPLAY_ORDER_PLACEHOLDER_PROPERTY = "[[P]]";
export const DISPLAY_ORDER_PLACEHOLDER_FOLDER = "[[f]]";

/**
 * A container for item props.
 * This class is used to store, sort, and filter item props.
 */
export class ItemPropsContainer {
  private items: NavigationItemPropsWithoutCollapsed[] = [];

  constructor(private plugin: NavLinkHeader) {}

  /**
   * Returns the items added so far.
   * The items are collapsed and sorted according to the plugin settings.
   * @return The sorted and collapsed items. The returned array is a new array.
   */
  public getItems(): NavigationItemProps[] {
    const items = this.getCollapsedItemProps();
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

      if (a.type === "three-way-link" && b.type === "three-way-link") {
        return a.index - b.index;
      } else if (a.type === "prefixed-link" && b.type === "prefixed-link") {
        return a.link.linkInfo.displayText.localeCompare(b.link.linkInfo.displayText, undefined, {
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
  public addItem(item: NavigationItemPropsWithoutCollapsed): void {
    // Filter out any prefixed links that have the same destination.
    if (this.plugin.settings.filterDuplicateNotes && item.type === "prefixed-link") {
      const i = this.items.findIndex((l) => {
        return (
          l.type === "prefixed-link" &&
          l.link.linkInfo.destination === item.link.linkInfo.destination
        );
      });
      if (i !== -1) {
        // If the link is already in the list
        const existingPrefix = (this.items[i] as PrefixedLinkProps).prefix.label;
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
   * Returns the item props after collapsing items according to the plugin settings.
   */
  private getCollapsedItemProps(): NavigationItemProps[] {
    const itemCollapsePrefixes = [...new Set(this.plugin.settings.itemCollapsePrefixes)].filter(
      (prefix) => prefix.length > 0
    );
    if (itemCollapsePrefixes.length === 0) {
      return [...this.items];
    }

    const items = this.items.map((item) => {
      if (item.type === "three-way-link") {
        // Deep copy ThreeWayLinkProps to modify its links array.
        return {
          ...item,
          links: {
            previous: { ...item.links.previous, links: [...item.links.previous.links] },
            next: { ...item.links.next, links: [...item.links.next.links] },
            parent: { ...item.links.parent, links: [...item.links.parent.links] },
          },
        } as ThreeWayLinkProps;
      } else {
        return item;
      }
    });
    const collapsedItems: CollapsedItemProps[] = [];
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
        if (item.type === "three-way-link") {
          [item.links.previous, item.links.next, item.links.parent].forEach((dir) => {
            for (let j = dir.links.length - 1; j >= 0; j--) {
              if (dir.links[j].prefix.label === prefix) {
                count++;
                dir.links.splice(j, 1);
              }
            }
          });
        } else {
          if (item.prefix.label === prefix) {
            count++;
            items.splice(i, 1);
          }
        }
      }

      if (count > 0) {
        collapsedItems.push({
          type: "collapsed-item",
          prefix: { label: prefix, clickHandler: prefixClickHandler },
          itemCount: count,
        });
      }
    }

    return [...items, ...collapsedItems];
  }
}

/**
 * Returns the sort tag for the item.
 * The sort tag is the equivalent of strings in `displayOrderOfLinks` setting.
 */
function getSortTag(item: NavigationItemProps): string {
  switch (item.type) {
    case "prefixed-link":
    case "note-content":
    case "collapsed-item":
      return item.prefix.label;
    case "three-way-link":
      switch (item.source) {
        case "periodic":
          return DISPLAY_ORDER_PLACEHOLDER_PERIODIC;
        case "property":
          return DISPLAY_ORDER_PLACEHOLDER_PROPERTY;
        case "folder":
          return DISPLAY_ORDER_PLACEHOLDER_FOLDER;
        default: {
          const _exhaustiveCheck: never = item.source;
          return _exhaustiveCheck;
        }
      }
    default: {
      const _exhaustiveCheck: never = item;
      return _exhaustiveCheck;
    }
  }
}

/**
 * Returns the order index for the item type.
 */
function getLinkTypeOrder(item: NavigationItemProps): number {
  switch (item.type) {
    case "three-way-link":
      return 0;
    case "prefixed-link":
      return 1;
    case "note-content":
      return 2;
    case "collapsed-item":
      return 3;
    default: {
      const _exhaustiveCheck: never = item;
      return _exhaustiveCheck;
    }
  }
}
