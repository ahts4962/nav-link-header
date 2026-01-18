import { TFile } from "obsidian";
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
    this.isActive = this.plugin.settings.displayInLeaves;
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

  public override onNavigationElementRemoved(element: Element): void {
    const navigationController = this.navigationControllers.get(element);
    if (navigationController) {
      navigationController.dispose();
      this.navigationControllers.delete(element);
    }
  }

  public override onSettingsChanged(
    previous: NavLinkHeaderSettings,
    current: NavLinkHeaderSettings,
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
          new NavigationController(this.plugin, navigationElement),
        );
      }

      const navigationController = this.navigationControllers.get(navigationElement);
      if (navigationController) {
        void navigationController.update(view.file, forced);
      }
    });
  }
}
