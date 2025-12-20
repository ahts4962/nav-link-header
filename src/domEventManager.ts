import type { WorkspaceWindow, HoverParent } from "obsidian";
import type NavLinkHeader from "./main";
import { NAVIGATION_ELEMENT_CLASS_NAME } from "./main";
import { PluginComponent } from "./pluginComponent";

/**
 * Processes DOM-related events.
 * The `DomEventManager` class uses `MutationObserver` to monitor changes in the DOM
 * and triggers appropriate events when navigation header elements are removed.
 * It also handles hover link events to manage hover popovers.
 */
export class DomEventManager extends PluginComponent {
  // A map to keep track of mutation observers for each window's body element.
  private observers: Map<HTMLBodyElement, MutationObserver> = new Map();

  // A map to keep track of navigation elements in each window's body element.
  private navigationElements: Map<HTMLBodyElement, Set<Element>> = new Map();

  // A reference to the hover parent obtained from the last hover-link event.
  // This is used to get the hover parent when the hover popover is actually created.
  private lastHoverParent?: WeakRef<HoverParent>;

  constructor(private plugin: NavLinkHeader) {
    super();

    this.plugin.app.workspace.iterateAllLeaves((leaf) => {
      this.addObserver(leaf.view.containerEl.closest("body"));
    });
  }

  public override onWindowOpen(window: WorkspaceWindow): void {
    this.addObserver(window.doc.querySelector("body"));
  }

  public override onWindowClose(window: WorkspaceWindow): void {
    const body = window.doc.querySelector("body");
    if (!body) {
      return;
    }

    const observer = this.observers.get(body);
    if (observer) {
      observer.disconnect();
      this.observers.delete(body);
    }

    const navigationElements = this.navigationElements.get(body);
    if (!navigationElements) {
      return;
    }
    for (const navigationElement of navigationElements) {
      this.plugin.app.workspace.trigger(
        "nav-link-header:navigation-element-removed",
        navigationElement
      );
    }
    this.navigationElements.delete(body);
  }

  public override onHoverLink(hoverParent: HoverParent): void {
    // Stores the hover parent when the hover-link event is triggered.
    this.lastHoverParent = new WeakRef(hoverParent);
  }

  public override dispose(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    this.navigationElements.clear();
  }

  /**
   * Adds a `MutationObserver` to the body element.
   * If `MutationObserver` is already added to the specified body element, this method does nothing.
   * @param body The body element to observe.
   */
  private addObserver(body: HTMLBodyElement | null): void {
    if (!body || this.observers.has(body)) {
      return;
    }

    const observer = new MutationObserver((records) => this.handleMutationRecords(records));
    observer.observe(body, { childList: true, subtree: true });
    this.observers.set(body, observer);
  }

  /**
   * Handles mutation records to detect added or removed navigation header elements.
   * Triggers appropriate events when navigation elements are added or removed.
   * Hover popovers creation event is also handled here.
   * @param records The mutation records to process.
   */
  private handleMutationRecords(records: MutationRecord[]): void {
    for (const record of records) {
      for (const node of record.removedNodes) {
        if (!(node instanceof Element)) {
          continue;
        }

        const navigationElements: Element[] = [];
        if (node.classList.contains(NAVIGATION_ELEMENT_CLASS_NAME)) {
          navigationElements.push(node);
        } else {
          navigationElements.push(...node.querySelectorAll(`.${NAVIGATION_ELEMENT_CLASS_NAME}`));
        }

        for (const navigationElement of navigationElements) {
          if (navigationElement.isConnected) {
            continue;
          }

          for (const elementsSet of this.navigationElements.values()) {
            elementsSet.delete(navigationElement);
          }
          this.plugin.app.workspace.trigger(
            "nav-link-header:navigation-element-removed",
            navigationElement
          );
        }
      }

      for (const node of record.addedNodes) {
        if (node instanceof Element && node.classList.contains(NAVIGATION_ELEMENT_CLASS_NAME)) {
          const parentBody = this.observers.keys().find((b) => b.contains(node));
          if (!parentBody) {
            continue;
          }
          let elementsSet = this.navigationElements.get(parentBody);
          if (!elementsSet) {
            elementsSet = new Set<Element>();
            this.navigationElements.set(parentBody, elementsSet);
          }
          elementsSet.add(node);
        } else if (
          node instanceof Element &&
          node.classList.contains("popover") &&
          node.classList.contains("hover-popover")
        ) {
          // Parent component is retrieved from the last hover-link event.
          const hoverParent = this.lastHoverParent?.deref();
          if (hoverParent) {
            this.plugin.app.workspace.trigger("nav-link-header:hover-popover-created", hoverParent);
          }
          break;
        }
      }
    }
  }
}
