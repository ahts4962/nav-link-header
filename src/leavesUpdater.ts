import { TFile } from "obsidian";
import type NavLinkHeader from "./main";
import { Updater } from "./updater";
import { NavigationComponent } from "./navigationComponent.svelte";
import type { NavLinkHeaderSettings } from "./settings";

/**
 * Updates and manages navigation in Obsidian workspace leaves.
 * The `LeavesUpdater` class is responsible for updating navigation links in all
 * relevant workspace leaves (such as markdown and canvas views) based on plugin
 * settings. It listens for navigation and settings changes, and updates or cleans up
 * navigation components as needed.
 */
export class LeavesUpdater extends Updater {
  private _isActive: boolean = false;

  public get isActive(): boolean {
    return this._isActive;
  }

  private set isActive(val: boolean) {
    if (this._isActive && !val) {
      this.cleanup();
    }
    this._isActive = val;
  }

  constructor(plugin: NavLinkHeader) {
    super(plugin);

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
      this.cleanup();
    }
  }

  public override dispose(): void {
    this.isActive = false;
  }

  /**
   * Updates the navigation links for all leaves.
   * @param forced See `NavigationComponent.update()`.
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
        (this.plugin.settings.displayInMarkdownViews && viewType === "markdown") ||
        (this.plugin.settings.displayInImageViews && viewType === "image") ||
        (this.plugin.settings.displayInVideoViews && viewType === "video") ||
        (this.plugin.settings.displayInAudioViews && viewType === "audio") ||
        (this.plugin.settings.displayInPdfViews && viewType === "pdf") ||
        (this.plugin.settings.displayInCanvasViews && viewType === "canvas") ||
        (this.plugin.settings.displayInBasesViews && viewType === "bases") ||
        (this.plugin.settings.displayInOtherViews && !knownViewTypes.includes(viewType))
      ) {
        if ("file" in view && view.file instanceof TFile) {
          this.updateNavigation({
            parent: view,
            container: view.containerEl,
            nextSibling: view.containerEl.querySelector(".view-content"),
            file: view.file,
            forced,
          });
        }
      }
    });
  }

  /**
   * Cleans up the resources.
   */
  private cleanup(): void {
    this.plugin.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;

      // Removes the added html elements.
      view.containerEl.querySelector(".nav-link-header-navigation")?.remove();

      // Removes the navigation components.
      if ("_children" in view && view._children instanceof Array) {
        for (const child of view._children) {
          if (child instanceof NavigationComponent) {
            view.removeChild(child);
            break;
          }
        }
      }
    });
  }
}
