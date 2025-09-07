import {
  Component,
  HoverPopover,
  MarkdownRenderer,
  TFile,
  type WorkspaceWindow,
  type HoverParent,
} from "obsidian";
import type NavLinkHeader from "./main";
import { Updater } from "./updater";

/**
 * A class that monitors hover popovers. When a hover popover is created, this class
 * triggers the addition of the navigation links to the hover popover.
 */
export class HoverPopoverUpdater extends Updater {
  // A map to store the observers for each body element.
  private observers: Map<HTMLBodyElement, MutationObserver> = new Map();

  // A reference to the hover parent obtained from the last hover-link event.
  // This is necessary because hover-link event does not directly create a popover.
  private lastHoverParent?: WeakRef<HoverParent>;

  constructor(plugin: NavLinkHeader) {
    super(plugin);

    // Adds observers to the existing windows.
    this.plugin.app.workspace.iterateAllLeaves((leaf) => {
      this.addObserver(leaf.view.containerEl.closest("body"));
    });
  }

  /**
   * Call this method when a new window is opened.
   */
  public onWindowOpen(window: WorkspaceWindow): void {
    // Adds an observer when a new window is opened.
    this.addObserver(window.doc.querySelector("body"));
  }

  /**
   * Adds a `MutationObserver` to the body element to detect addition of hover popovers.
   * If `MutationObserver` is already added to the specified body element, this method does nothing.
   * @param body The body element to observe. Container elements of the popovers are added
   *     to this element.
   */
  private addObserver(body: HTMLBodyElement | null): void {
    if (!body || this.observers.has(body)) {
      return;
    }

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (
            node instanceof Element &&
            node.classList.contains("popover") &&
            node.classList.contains("hover-popover")
          ) {
            this.updateHoverPopover();
            return;
          }
        }
      }
    });

    observer.observe(body, { childList: true });
    this.observers.set(body, observer);
  }

  /**
   * Call this method when a window is closed.
   */
  public onWindowClose(window: WorkspaceWindow): void {
    // Removes the observer when a window is closed.
    const body = window.doc.querySelector("body");
    if (body) {
      const observer = this.observers.get(body);
      if (observer) {
        observer.disconnect();
        this.observers.delete(body);
      }
    }
  }

  /**
   * Call this method when the hover-link event is triggered.
   */
  public onHoverLink(hoverParent: HoverParent): void {
    // Stores the hover parent when the hover-link event is triggered.
    // This is used when the hover popover is actually created later.
    this.lastHoverParent = new WeakRef(hoverParent);
  }

  /**
   * Adds the navigation links to the newly created hover popover.
   */
  private updateHoverPopover(): void {
    // Parent component is retrieved from the last hover-link event.
    const hoverParent = this.lastHoverParent?.deref();
    if (!(hoverParent?.hoverPopover instanceof HoverPopover)) {
      return;
    }

    const hoverPopover = hoverParent.hoverPopover;
    if (!("_children" in hoverPopover && hoverPopover._children instanceof Array)) {
      return;
    }

    const children = hoverPopover._children;
    for (const child of children) {
      if (!(child instanceof Component)) {
        continue;
      }

      if (
        "file" in child &&
        child.file instanceof TFile &&
        "containerEl" in child &&
        child.containerEl instanceof Element
      ) {
        // Specify the hover parent to be used when displaying more hover popovers
        // from this hover popover later.
        // Here, `MarkdownRenderer` of this hover popover is used.
        // This seems to be the default behavior of the Obsidian's own hover popover.
        let hoverParent: Component = child;
        if ("_children" in child && child._children instanceof Array) {
          for (const grandChild of child._children) {
            if (grandChild instanceof MarkdownRenderer) {
              hoverParent = grandChild;
              break;
            }
          }
        }

        this.updateNavigation({
          parent: child,
          container: child.containerEl,
          nextSibling: child.containerEl.querySelector(".markdown-embed-content"),
          file: child.file,
          hoverParent,
          forced: true,
        });
      }
    }
  }

  /**
   * Cleans up the resources.
   */
  public dispose(): void {
    // Disconnects all observers.
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }
}
