import { TFile, type WorkspaceWindow } from "obsidian";
import type NavLinkHeader from "./main";
import { NAVIGATION_ELEMENT_CLASS_NAME } from "./main";
import { PluginComponent } from "./pluginComponent";
import { NavigationController } from "./navigationController.svelte";
import type { NavLinkHeaderSettings } from "./settings";

/**
 * Updates and manages navigation headers in Obsidian workspace leaves.
 * The `LeavesUpdater` class is responsible for updating navigation headers in all
 * relevant workspace leaves (such as markdown and canvas views) based on plugin settings.
 */
export class LeavesUpdater extends PluginComponent {
  // A map to keep track of mutation observers for each window's body element.
  private observers: Map<HTMLBodyElement, MutationObserver> = new Map();

  // A map to keep track of navigation controllers for each navigation element.
  private navigationControllers: Map<Element, NavigationController> = new Map();

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
    }
    this._isActive = val;
  }

  constructor(private plugin: NavLinkHeader) {
    super();
    this.isActive = this.plugin.settings.displayInLeaves;
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

  public override onNavigationUpdateRequired(): void {
    if (this.isActive) {
      this.updateAllLeaves(false);
    }
  }

  public override onForcedNavigationUpdateRequired(): void {
    if (this.isActive) {
      this.updateAllLeaves(true);
    }
  }

  public override onSettingsChanged(
    previous: NavLinkHeaderSettings,
    current: NavLinkHeaderSettings
  ): void {
    if (previous.displayInLeaves !== current.displayInLeaves) {
      this.isActive = current.displayInLeaves;
    } else if (
      current.displayInLeaves &&
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
   * Removes all navigation elements and their associated controllers from all leaves.
   */
  private removeAllNavigationElements(): void {
    this.plugin.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;

      // Removes the added html elements.
      view.containerEl.querySelector(`.${NAVIGATION_ELEMENT_CLASS_NAME}`)?.remove();
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
   * Adds a `MutationObserver` to the body element to detect removal of navigation elements.
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
      }
    });

    observer.observe(body, { childList: true, subtree: true });
    this.observers.set(body, observer);
  }

  /**
   * Updates navigation headers for all leaves.
   * @param forced See `NavigationController.update()`.
   */
  public updateAllLeaves(forced: boolean): void {
    this.plugin.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      const viewType = view.getViewType();
      const knownViewTypes = [
        "markdown",
        "image",
        "video",
        "audio",
        "pdf",
        "canvas",
        "bases",
        "backlink",
        "outgoing-link",
        "outline",
        "localgraph",
      ];

      if (
        !(
          (this.plugin.settings.displayInMarkdownViews && viewType === "markdown") ||
          (this.plugin.settings.displayInImageViews && viewType === "image") ||
          (this.plugin.settings.displayInVideoViews && viewType === "video") ||
          (this.plugin.settings.displayInAudioViews && viewType === "audio") ||
          (this.plugin.settings.displayInPdfViews && viewType === "pdf") ||
          (this.plugin.settings.displayInCanvasViews && viewType === "canvas") ||
          (this.plugin.settings.displayInBasesViews && viewType === "bases") ||
          (this.plugin.settings.displayInOtherViews && !knownViewTypes.includes(viewType))
        )
      ) {
        return;
      }

      if (!("file" in view) || !(view.file instanceof TFile)) {
        return;
      }

      let navigationElement = view.containerEl.querySelector(`.${NAVIGATION_ELEMENT_CLASS_NAME}`);

      // Creates a new element for the navigation header, if not already added.
      if (!navigationElement) {
        navigationElement = view.containerEl.createDiv({ cls: NAVIGATION_ELEMENT_CLASS_NAME });
        const nextSibling = view.containerEl.querySelector(".view-content");
        if (nextSibling) {
          view.containerEl.insertBefore(navigationElement, nextSibling);
        } else {
          view.containerEl.prepend(navigationElement);
        }

        this.navigationControllers.set(
          navigationElement,
          new NavigationController(this.plugin, navigationElement)
        );
      }

      const navigationController = this.navigationControllers.get(navigationElement);
      if (navigationController) {
        void navigationController.update(view.file, forced);
      }
    });
  }
}
