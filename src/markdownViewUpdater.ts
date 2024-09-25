import { Component, MarkdownRenderer, MarkdownView } from "obsidian";
import type NavLinkHeader from "./main";
import { NavigationComponent } from "./navigationComponent";
import { Debouncer } from "./utils";
import { Updater } from "./updater";

export class MarkdownViewUpdater extends Updater {
	private debouncer: Debouncer = new Debouncer(1500);

	constructor(plugin: NavLinkHeader) {
		super(plugin);

		this.debouncer.run(() => {
			this.updateAll({ forced: true });
		});
	}

	public onLayoutChange(): void {
		this.updateAll({ forced: false });
	}

	public onVaultChange(): void {
		// Updates the navigation links when the file changes.
		this.debouncer.run(() => {
			this.updateAll({ forced: true });
		});
	}

	public onSettingsChange(): void {
		// Updates the navigation links when the settings change
		this.debouncer.run(() => {
			this.updateAll({ forced: true });
		});
	}

	/**
	 * Updates the navigation links for all markdown views.
	 * @param forced See `NavigationComponent.update`.
	 */
	public updateAll({ forced }: { forced: boolean }): void {
		this.plugin.app.workspace.iterateAllLeaves((leaf) => {
			const view = leaf.view;

			if (view instanceof MarkdownView && view.file) {
				// Set hover parent to the `MarkdownView` when source mode.
				// Set hover parent to the `MarkdownRenderer` of the `MarkdownView` when preview mode.
				// This is the default behavior of the Obsidian's own hover popover.
				const state = view.getState() as { mode: string };
				let hoverParent: Component = view;
				if (state.mode === "preview") {
					if (
						"_children" in view &&
						view._children instanceof Array
					) {
						for (const child of view._children) {
							if (child instanceof MarkdownRenderer) {
								hoverParent = child;
								break;
							}
						}
					}
				}

				this.updateNavigation({
					parent: view,
					container: view.containerEl,
					nextSibling:
						view.containerEl.querySelector(".view-content"),
					file: view.file,
					hoverParent,
					forced,
				});
			}
		});
	}

	public dispose(): void {
		this.debouncer.cancel();

		this.plugin.app.workspace.iterateAllLeaves((leaf) => {
			const view = leaf.view;
			if (view instanceof MarkdownView) {
				// Removes the added html elements.
				view.containerEl
					.querySelector(".nav-link-header-navigation")
					?.remove();

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
