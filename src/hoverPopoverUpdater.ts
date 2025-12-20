import { Component, HoverPopover, TFile, type HoverParent } from "obsidian";
import type NavLinkHeader from "./main";
import { NAVIGATION_ELEMENT_CLASS_NAME } from "./main";
import { PluginComponent } from "./pluginComponent";
import { NavigationController } from "./navigationController.svelte";
import type { NavLinkHeaderSettings } from "./settings";

/**
 * Updates and manages navigation headers in hover popovers.
 * The `HoverPopoverUpdater` class is responsible for updating navigation headers in
 * hover popovers based on plugin settings.
 */
export class HoverPopoverUpdater extends PluginComponent {
  // A map to keep track of navigation controllers for each navigation element.
  private navigationControllers: Map<Element, NavigationController> = new Map();

  private _isActive: boolean = false;

  public get isActive(): boolean {
    return this._isActive;
  }

  private set isActive(val: boolean) {
    if (this._isActive && !val) {
      this.removeAllNavigationElements();
    }
    this._isActive = val;
  }

  constructor(private plugin: NavLinkHeader) {
    super();
    this.isActive = this.plugin.settings.displayInHoverPopovers;
  }

  public override onForcedNavigationUpdateRequired(): void {
    if (this.isActive) {
      for (const navigationController of this.navigationControllers.values()) {
        void navigationController.update(null, true);
      }
    }
  }

  public override onNavigationElementRemoved(element: Element): void {
    const navigationController = this.navigationControllers.get(element);
    if (navigationController) {
      navigationController.dispose();
      this.navigationControllers.delete(element);
    }
  }

  public override onHoverPopoverCreated(hoverParent: HoverParent): void {
    if (this.isActive) {
      void this.addNavigationToHoverPopover(hoverParent);
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
   * Removes all navigation elements and their associated controllers from all popovers.
   */
  private removeAllNavigationElements(): void {
    this.plugin.app.workspace.iterateAllLeaves((leaf) => {
      const hoverPopoverElements = leaf.view.containerEl
        .closest("body")
        ?.querySelectorAll(".popover.hover-popover");
      if (!hoverPopoverElements) {
        return;
      }

      for (const hoverPopoverElement of hoverPopoverElements) {
        hoverPopoverElement.querySelector(`.${NAVIGATION_ELEMENT_CLASS_NAME}`)?.remove();
      }
    });

    for (const navigationController of this.navigationControllers.values()) {
      navigationController.dispose();
    }
    this.navigationControllers.clear();
  }

  /**
   * Adds a navigation header to the newly created hover popover.
   */
  private async addNavigationToHoverPopover(hoverParent: HoverParent): Promise<void> {
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
