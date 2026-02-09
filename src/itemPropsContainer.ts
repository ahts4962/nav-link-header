import type NavLinkHeader from "./main";
import type { ThreeWayDirection } from "./types";
import type {
  CollapsedItemProps,
  NavigationItemProps,
  PrefixedLinkProps,
  PrefixedMultiLinkProps,
  PrefixEventHandler,
  RawNavigationItemProps,
  ThreeWayContentProps,
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
  private items: RawNavigationItemProps[] = [];

  constructor(
    private plugin: NavLinkHeader,
    private prefixClickHandlerForCollapsedItems: PrefixEventHandler,
  ) {}

  /**
   * Returns the items added so far.
   * The items are collapsed and sorted according to the plugin settings.
   * @return The sorted and collapsed items. The returned array is a new array.
   */
  public getItems(): NavigationItemProps[] {
    const directions = ["previous", "next", "parent"] as const;

    let items = this.collapseItemProps(this.items);

    // Remove any three-way links that have no links after collapsing.
    items = items.filter((item) => {
      if (
        item.type === "three-way-link" &&
        directions.every((dir) => item.links[dir].links.length === 0)
      ) {
        return false;
      }
      return true;
    });

    items = this.mergeItemProps(items, true);

    // Merge links within three-way links.
    items = items.map((item) => {
      if (item.type === "three-way-link") {
        const links = directions.reduce(
          (acc, dir) => {
            acc[dir] = {
              ...item.links[dir],
              links: this.mergeItemProps(item.links[dir].links, false) as ThreeWayContentProps[],
            };
            return acc;
          },
          {} as Record<ThreeWayDirection, { links: ThreeWayContentProps[]; hidden: boolean }>,
        );
        return {
          ...item,
          links,
        };
      }
      return item;
    });

    this.sortItemProps(items);

    return items;
  }

  /**
   * Adds an item to the container.
   * The item is filtered according to the plugin settings.
   * @param item The item to add.
   */
  public addItem(item: RawNavigationItemProps): void {
    if (item.type !== "prefixed-link") {
      this.items.push(item);
      return;
    }

    // Filter out any prefixed links that are exactly the same.
    const i = this.items.findIndex((l) => {
      return (
        l.type === "prefixed-link" &&
        l.prefix.label === item.prefix.label &&
        l.link.linkInfo.destination === item.link.linkInfo.destination &&
        l.link.linkInfo.displayText === item.link.linkInfo.displayText
      );
    });
    if (i !== -1) {
      return;
    }

    if (!this.plugin.settings.filterDuplicateNotes) {
      this.items.push(item);
      return;
    }

    // Filter out any prefixed links that have the same destination.
    const j = this.items.findIndex((l) => {
      return (
        l.type === "prefixed-link" && l.link.linkInfo.destination === item.link.linkInfo.destination
      );
    });
    if (j === -1) {
      this.items.push(item);
      return;
    }

    // If the link is already in the list
    const existingPrefix = (this.items[j] as PrefixedLinkProps).prefix.label;
    const newPrefix = item.prefix.label;
    const priority = this.plugin.settings.duplicateNoteFilteringPriority;
    const existingIndex = priority.indexOf(existingPrefix);
    const newIndex = priority.indexOf(newPrefix);
    if (existingIndex === -1 && newIndex === -1) {
      if (existingPrefix.localeCompare(newPrefix, undefined, { numeric: true }) > 0) {
        this.items[j] = item;
      } else {
        return;
      }
    } else if (existingIndex === -1) {
      this.items[j] = item;
    } else if (newIndex === -1) {
      return;
    } else {
      if (newIndex < existingIndex) {
        this.items[j] = item;
      } else {
        return;
      }
    }
  }

  /**
   * Returns the item props after collapsing items according to the plugin settings.
   */
  private collapseItemProps(items: RawNavigationItemProps[]): NavigationItemProps[] {
    const itemCollapsePrefixes = [...new Set(this.plugin.settings.itemCollapsePrefixes)].filter(
      (prefix) => prefix.length > 0,
    );
    if (itemCollapsePrefixes.length === 0) {
      return [...items];
    }

    items = items.map((item) => {
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
          prefix: { label: prefix, clickHandler: this.prefixClickHandlerForCollapsedItems },
          itemCount: count,
        });
      }
    }

    return [...items, ...collapsedItems];
  }

  /**
   * Merges the item props according to the plugin settings.
   * This method merges prefixed links with the same prefix into a single
   * `PrefixedMultiLinkProps` item.
   * @param items The items to merge.
   * @param sortLinks Whether to sort the links within `PrefixedMultiLinkProps`
   *     according to their display text.
   * @return The merged items. The returned array is a new array.
   */
  private mergeItemProps(items: NavigationItemProps[], sortLinks: boolean): NavigationItemProps[] {
    const mergePrefixes = [...new Set(this.plugin.settings.mergePrefixes)].filter(
      (prefix) => prefix.length > 0,
    );
    if (mergePrefixes.length === 0) {
      return [...items];
    }

    const mergedItems = items.filter(
      (item) => item.type !== "prefixed-link" || !mergePrefixes.includes(item.prefix.label),
    );
    for (const prefix of mergePrefixes) {
      const itemsToMerge = items.filter(
        (item) => item.type === "prefixed-link" && item.prefix.label === prefix,
      ) as PrefixedLinkProps[];

      if (itemsToMerge.length === 0) {
        continue;
      }

      if (itemsToMerge.length === 1) {
        mergedItems.push(itemsToMerge[0]);
        continue;
      }

      const links = itemsToMerge.map((item) => item.link);
      if (sortLinks) {
        links.sort((a, b) => {
          return a.linkInfo.displayText.localeCompare(b.linkInfo.displayText, undefined, {
            numeric: true,
          });
        });
      }
      const mergedItem: PrefixedMultiLinkProps = {
        type: "prefixed-multi-link",
        prefix: itemsToMerge[0].prefix,
        links,
      };
      mergedItems.push(mergedItem);
    }
    return mergedItems;
  }

  /**
   * Sorts the item props according to the plugin settings.
   * The items are sorted in-place.
   * @param items The items to sort.
   */
  private sortItemProps(items: NavigationItemProps[]): void {
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
  }
}

/**
 * Returns the sort tag for the item.
 * The sort tag is the equivalent of strings in `displayOrderOfLinks` setting.
 */
function getSortTag(item: NavigationItemProps): string {
  switch (item.type) {
    case "prefixed-link":
    case "prefixed-multi-link":
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
    case "prefixed-multi-link":
      return 1;
    case "prefixed-link":
      return 2;
    case "note-content":
      return 3;
    case "collapsed-item":
      return 4;
    default: {
      const _exhaustiveCheck: never = item;
      return _exhaustiveCheck;
    }
  }
}
