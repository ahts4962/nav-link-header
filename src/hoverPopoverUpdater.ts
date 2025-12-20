import { Component, HoverPopover, TFile, type HoverParent, type WorkspaceWindow } from "obsidian";
import type NavLinkHeader from "./main";
import { NAVIGATION_ELEMENT_CLASS_NAME } from "./main";
import { PluginComponent } from "./pluginComponent";
import { NavigationController } from "./navigationController.svelte";
import type { NavLinkHeaderSettings } from "./settings";

/**
 * A class that monitors hover popovers. When a hover popover is created, this class
 * triggers the addition of the navigation header to the hover popover.
 */
export class HoverPopoverUpdater extends PluginComponent {
  // A map to keep track of mutation observers for each window's body element.
  private observers: Map<HTMLBodyElement, MutationObserver> = new Map();

  // A map to keep track of navigation controllers for each navigation element.
  private navigationControllers: Map<Element, NavigationController> = new Map();

  // A reference to the hover parent obtained from the last hover-link event.
  // This is used to get the hover parent when the hover popover is actually created.
  private lastHoverParent?: WeakRef<HoverParent>;

  private _isActive: boolean = false;

  public get isActive(): boolean {
    return this._isActive;
  }

  private set isActive(val: boolean) {
    if (!this._isActive && val) {
      this.addObserversToAllWindows();
    }
    if (this._isActive && !val) {
      this.removeAllNavigationElements();
      this.removeAllObservers();
      this.lastHoverParent = undefined;
    }
    this._isActive = val;
  }

  constructor(private plugin: NavLinkHeader) {
    super();
    this.isActive = this.plugin.settings.displayInHoverPopovers;
  }

  public override onWindowOpen(window: WorkspaceWindow): void {
    if (this.isActive) {
      // Adds an observer when a new window is opened.
      this.addObserver(window.doc.querySelector("body"));
    }
  }

  public override onWindowClose(window: WorkspaceWindow): void {
    if (this.isActive) {
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
  }

  public override onHoverLink(hoverParent: HoverParent): void {
    // Stores the hover parent when the hover-link event is triggered.
    this.lastHoverParent = new WeakRef(hoverParent);
  }

  public override onForcedNavigationUpdateRequired(): void {
    if (this.isActive) {
      for (const navigationController of this.navigationControllers.values()) {
        void navigationController.update(null, true);
      }
    }
  }

  public override onSettingsChanged(
    previous: NavLinkHeaderSettings,
    current: NavLinkHeaderSettings
  ): void {
    if (previous.displayInHoverPopovers !== current.displayInHoverPopovers) {
      this.isActive = current.displayInHoverPopovers;
    } else if (
      current.displayInHoverPopovers &&
      (previous.displayInMarkdownViews !== current.displayInMarkdownViews ||
        previous.displayInImageViews !== current.displayInImageViews ||
        previous.displayInVideoViews !== current.displayInVideoViews ||
        previous.displayInAudioViews !== current.displayInAudioViews ||
        previous.displayInPdfViews !== current.displayInPdfViews ||
        previous.displayInCanvasViews !== current.displayInCanvasViews ||
        previous.displayInBasesViews !== current.displayInBasesViews ||
        previous.displayInOtherViews !== current.displayInOtherViews)
    ) {
      this.removeAllNavigationElements();
    }
  }

  public override dispose(): void {
    this.isActive = false;
  }

  /**
   * Adds observers to all currently opened windows.
   */
  private addObserversToAllWindows(): void {
    this.plugin.app.workspace.iterateAllLeaves((leaf) => {
      this.addObserver(leaf.view.containerEl.closest("body"));
    });
  }

  /**
   * Removes all navigation elements and their associated controllers from all popovers.
   */
  private removeAllNavigationElements(): void {
    this.plugin.app.workspace.iterateAllLeaves((leaf) => {
      const navigationElements = leaf.view.containerEl
        .closest("body")
        ?.querySelectorAll(`.${NAVIGATION_ELEMENT_CLASS_NAME}`);

      if (navigationElements) {
        // Removes the added html elements.
        for (const navigationElement of navigationElements) {
          navigationElement.remove();
        }
      }
    });

    for (const navigationController of this.navigationControllers.values()) {
      navigationController.dispose();
    }
    this.navigationControllers.clear();
  }

  /**
   * Cleans up all observers.
   */
  public removeAllObservers(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }

  /**
   * Adds a `MutationObserver` to the body element to detect addition of hover popovers and
   * removal of navigation elements.
   * If `MutationObserver` is already added to the specified body element, this method does nothing.
   * @param body The body element to observe.
   */
  private addObserver(body: HTMLBodyElement | null): void {
    if (!body || this.observers.has(body)) {
      return;
    }

    const observer = new MutationObserver((records) => {
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
            const navigationController = this.navigationControllers.get(navigationElement);
            if (navigationController) {
              navigationController.dispose();
              this.navigationControllers.delete(navigationElement);
            }
          }
        }

        for (const node of record.addedNodes) {
          if (
            node instanceof Element &&
            node.classList.contains("popover") &&
            node.classList.contains("hover-popover")
          ) {
            void this.addNavigationToHoverPopover();
            break;
          }
        }
      }
    });

    observer.observe(body, { childList: true, subtree: true });
    this.observers.set(body, observer);
  }

  /**
   * Adds a navigation header to the newly created hover popover.
   */
  private async addNavigationToHoverPopover(): Promise<void> {
    // Parent component is retrieved from the last hover-link event.
    const hoverParent = this.lastHoverParent?.deref();
    if (!(hoverParent?.hoverPopover instanceof HoverPopover)) {
      return;
    }

    const hoverPopover = hoverParent.hoverPopover;
    if (!("_children" in hoverPopover && hoverPopover._children instanceof Array)) {
      return;
    }

    // Sometimes, like when the graph view is opened in a separate window,
    // the child component of hoverPopover takes a bit longer to be added.
    // Wait here until it shows up.
    const children = hoverPopover._children;
    for (let i = 0; i < 30; i++) {
      if (children.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (!this.isActive) {
          return;
        }
      } else {
        break;
      }
    }
    if (children.length === 0) {
      return;
    }

    for (const child of children) {
      if (!(child instanceof Component)) {
        continue;
      }

      if (
        !(
          "file" in child &&
          child.file instanceof TFile &&
          "containerEl" in child &&
          child.containerEl instanceof Element
        )
      ) {
        continue;
      }

      // Some plugins update the contents of the popover asynchronously, so wait a bit.
      await new Promise((resolve) => setTimeout(resolve, 0));

      let processed: boolean = false;
      let nextSibling: Element | null = null;

      // The file formats are taken from https://help.obsidian.md/file-formats
      switch (child.file.extension.toLowerCase()) {
        case "md":
          nextSibling = child.containerEl.querySelector(".markdown-embed-content");
          if (nextSibling !== null) {
            if (!this.plugin.settings.displayInMarkdownViews) {
              continue;
            }
            processed = true;
          }
          break;
        case "avif":
        case "bmp":
        case "gif":
        case "jpeg":
        case "jpg":
        case "png":
        case "svg":
        case "webp":
          nextSibling = child.containerEl.querySelector("img");
          if (nextSibling !== null) {
            if (!this.plugin.settings.displayInImageViews) {
              continue;
            }
            processed = true;
          }
          break;
        case "mkv":
        case "mov":
        case "mp4":
        case "ogv":
          nextSibling = child.containerEl.querySelector("video");
          if (nextSibling !== null) {
            if (!this.plugin.settings.displayInVideoViews) {
              continue;
            }
            processed = true;
          }
          break;
        case "flac":
        case "m4a":
        case "mp3":
        case "ogg":
        case "wav":
        case "3gp":
          nextSibling = child.containerEl.querySelector("audio");
          if (nextSibling !== null) {
            if (!this.plugin.settings.displayInAudioViews) {
              continue;
            }
            processed = true;
          }
          break;
        case "webm":
          nextSibling = child.containerEl.querySelector("video");
          if (nextSibling !== null) {
            if (!this.plugin.settings.displayInVideoViews) {
              continue;
            }
            processed = true;
          } else {
            nextSibling = child.containerEl.querySelector("audio");
            if (nextSibling !== null) {
              if (!this.plugin.settings.displayInAudioViews) {
                continue;
              }
              processed = true;
            }
          }
          break;
        case "pdf":
          // The sibling element does not exist at this time
          if (!this.plugin.settings.displayInPdfViews) {
            continue;
          }
          processed = true;
          break;
        case "canvas":
          nextSibling = child.containerEl.querySelector(".canvas-minimap");
          if (nextSibling !== null) {
            if (!this.plugin.settings.displayInCanvasViews) {
              continue;
            }
            processed = true;
          }
          break;
        case "base":
          nextSibling = child.containerEl.querySelector(".bases-header");
          if (nextSibling !== null) {
            if (!this.plugin.settings.displayInBasesViews) {
              continue;
            }
            processed = true;
          }
          break;
      }

      let container = child.containerEl;

      if (!processed) {
        // Handle as "Other views"
        if (!this.plugin.settings.displayInOtherViews) {
          continue;
        }

        // For some plugins, the contents of the hover popover may be replaced,
        // making child.containerEl unusable as the container.
        // Assume that the container is the first child element of the hover popover.
        if (hoverPopover.hoverEl.children.length === 0) {
          continue;
        }
        container = hoverPopover.hoverEl.children[0];
        nextSibling = null;
      }

      const navigationElement = container.createDiv({ cls: NAVIGATION_ELEMENT_CLASS_NAME });
      if (nextSibling) {
        container.insertBefore(navigationElement, nextSibling);
      } else {
        container.prepend(navigationElement);
      }

      const navigationController = new NavigationController(this.plugin, navigationElement);
      this.navigationControllers.set(navigationElement, navigationController);
      void navigationController.update(child.file, true);
    }
  }
}
