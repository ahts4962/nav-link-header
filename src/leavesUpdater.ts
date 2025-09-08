import { debounce, TFile } from "obsidian";
import type NavLinkHeader from "./main";
import { Updater } from "./updater";
import { NavigationComponent } from "./navigationComponent.svelte";

export class LeavesUpdater extends Updater {
  constructor(plugin: NavLinkHeader) {
    super(plugin);
    this.debouncedUpdateAll();
  }

  public onLayoutChange(): void {
    this.updateAll({ forced: false });
  }

  public onVaultChange(): void {
    // Updates the navigation links when any file is changed.
    this.debouncedUpdateAll();
  }

  public onSettingsChange(): void {
    // Updates the navigation links when the settings is changed.
    this.updateAll({ forced: true });
  }

  private debouncedUpdateAll = debounce(
    () => {
      this.updateAll({ forced: true });
    },
    500,
    true
  );

  /**
   * Updates the navigation links for all leaves.
   * @param forced See `NavigationComponent.update`.
   */
  public updateAll({ forced }: { forced: boolean }): void {
    this.plugin.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;

      if (
        (this.plugin.settings!.displayInMarkdownViews && view.getViewType() === "markdown") ||
        (this.plugin.settings!.displayInCanvasViews && view.getViewType() === "canvas")
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
  public dispose(): void {
    this.debouncedUpdateAll.cancel();

    this.plugin.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (view.getViewType() === "markdown" || view.getViewType() === "canvas") {
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
      }
    });
  }
}
