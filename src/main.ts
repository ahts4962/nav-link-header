import {
	Component,
	HoverPopover,
	MarkdownRenderer,
	MarkdownView,
	Plugin,
	TFile,
	type HoverParent,
} from "obsidian";
import { NavigationComponent } from "./navigationComponent";
import { PeriodicNotesManager } from "./periodicNotes";
import {
	DEFAULT_SETTINGS,
	NavLinkHeaderSettingTab,
	type NavLinkHeaderSettings,
} from "./settings";

export default class NavLinkHeader extends Plugin {
	// A map to store the observers for each body element.
	private observers: Map<HTMLBodyElement, MutationObserver> = new Map();

	// A reference to the hover parent obtained from the last hover-link event.
	// This is needed because hover-link event does not directly create a popover.
	private lastHoverParent?: WeakRef<HoverParent>;

	public periodicNotesManager?: PeriodicNotesManager;

	private layoutReady: boolean = false;
	private updateDebounceTimer?: number;

	public settings?: NavLinkHeaderSettings;

	public onload(): void {
		void this.initialize();
	}

	private async initialize(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new NavLinkHeaderSettingTab(this));

		this.app.workspace.onLayoutReady(() => {
			this.layoutReady = true;

			if (this.periodicNotesEnabled) {
				this.periodicNotesManager = new PeriodicNotesManager(this);
			}

			this.app.workspace.iterateAllLeaves((leaf) => {
				this.addObserver(leaf.view.containerEl.closest("body"));
			});

			// Adds an observer when a new window is opened.
			// This observer is used to detect the addition of hover popovers.
			this.registerEvent(
				this.app.workspace.on("window-open", (window) => {
					this.addObserver(window.doc.querySelector("body"));
				})
			);

			// Removes the observer when a window is closed.
			this.registerEvent(
				this.app.workspace.on("window-close", (window) => {
					const body = window.doc.querySelector("body");
					if (body) {
						const observer = this.observers.get(body);
						if (observer) {
							observer.disconnect();
							this.observers.delete(body);
						}
					}
				})
			);

			// Updates the navigation links when the layout changes.
			// This includes the following situations.
			// - A new note has been opened.
			// - Current note has been renamed.
			// - A leaf has been split.
			// - A new window has been opened.
			// - Another note has been opened via the link.
			// ...etc.
			this.registerEvent(
				this.app.workspace.on("layout-change", () => {
					this.updateAllMarkdownViews(false);
				})
			);

			// Updates the navigation links when the file changes.
			// Apply debouncing to the following events.
			this.registerEvent(
				this.app.vault.on("create", (file) => {
					this.periodicNotesManager?.onFileCreated(file);
					this.updateAllMarkdownViewsWithDebounce(true);
				})
			);

			this.registerEvent(
				this.app.vault.on("delete", (file) => {
					this.periodicNotesManager?.onFileDeleted(file);
					this.updateAllMarkdownViewsWithDebounce(true);
				})
			);

			this.registerEvent(
				this.app.vault.on("rename", (file, oldPath) => {
					this.periodicNotesManager?.onFileRenamed(file, oldPath);
					this.updateAllMarkdownViewsWithDebounce(true);
				})
			);

			this.registerEvent(
				this.app.vault.on("modify", () => {
					this.updateAllMarkdownViewsWithDebounce(true);
				})
			);

			this.registerEvent(
				this.app.workspace.on(
					// @ts-expect-error: custom event.
					"nav-link-header:settings-changed",
					() => {
						this.periodicNotesManager?.updateEntireCache();
						this.updateAllMarkdownViewsWithDebounce(true);
					}
				)
			);

			this.registerEvent(
				this.app.workspace.on(
					// @ts-expect-error: custom event.
					"periodic-notes:settings-updated",
					() => {
						this.periodicNotesManager?.updateEntireCache();
						this.updateAllMarkdownViewsWithDebounce(true);
					}
				)
			);

			// Registers the hover link source for the hover popover.
			this.registerHoverLinkSource("nav-link-header", {
				defaultMod: true,
				display: "Nav Link Header",
			});

			// Stores the hover parent when the hover-link event is triggered.
			// This is used when the hover popover is actually created later.
			this.registerEvent(
				// @ts-expect-error: hover-link event is not exposed explicitly.
				this.app.workspace.on("hover-link", ({ hoverParent }) => {
					this.lastHoverParent = new WeakRef(hoverParent);
				})
			);

			this.updateAllMarkdownViewsWithDebounce(true);
		});
	}

	private async loadSettings(): Promise<void> {
		const result = {} as Record<keyof NavLinkHeaderSettings, unknown>;
		const data = (await this.loadData()) as Record<string, unknown>;
		for (const key of Object.keys(
			DEFAULT_SETTINGS
		) as (keyof NavLinkHeaderSettings)[]) {
			if (key in data) {
				result[key] = data[key];
			} else {
				result[key] = DEFAULT_SETTINGS[key];
			}
		}
		this.settings = result as NavLinkHeaderSettings;
	}

	public async saveSettings(): Promise<void> {
		if (this.settings) {
			await this.saveData(this.settings);
		}
	}

	private get periodicNotesEnabled(): boolean {
		const settings = this.settings;
		if (!settings) {
			return false;
		}
		return (
			settings.dailyNoteLinksEnabled ||
			settings.weeklyNoteLinksEnabled ||
			settings.monthlyNoteLinksEnabled ||
			settings.quarterlyNoteLinksEnabled ||
			settings.yearlyNoteLinksEnabled
		);
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
	 * Updates the navigation links for all markdown views.
	 * This method debounces the update to prevent frequent updates.
	 * @param forced See `NavigationComponent.update`.
	 */
	private updateAllMarkdownViewsWithDebounce(forced: boolean): void {
		if (!this.layoutReady) {
			return;
		}

		if (this.updateDebounceTimer) {
			window.clearTimeout(this.updateDebounceTimer);
		}
		this.updateDebounceTimer = window.setTimeout(() => {
			this.updateDebounceTimer = undefined;
			this.updateAllMarkdownViews(forced);
		}, 1000);
	}

	/**
	 * Updates the navigation links for all markdown views.
	 * @param forced See `NavigationComponent.update`.
	 */
	public updateAllMarkdownViews(forced: boolean): void {
		if (!this.layoutReady) {
			return;
		}

		this.app.workspace.iterateAllLeaves((leaf) => {
			const view = leaf.view;

			if (view instanceof MarkdownView && view.file) {
				// Set hover parent to the MarkdownView when source mode.
				// Set hover parent to the MarkdownRenderer of the MarkdownView when preview mode.
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

				this.updateNavigation(
					view,
					view.containerEl,
					view.containerEl.querySelector(".view-content"),
					view.file,
					hoverParent,
					forced
				);
			}
		});
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
		if (
			!(
				"_children" in hoverPopover &&
				hoverPopover._children instanceof Array
			)
		) {
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
				// Set hover parent to the MarkdownRenderer of the HoverPopover.
				// This is the default behavior of the Obsidian's own hover popover.
				let hoverParent: Component = child;
				if ("_children" in child && child._children instanceof Array) {
					for (const grandChild of child._children) {
						if (grandChild instanceof MarkdownRenderer) {
							hoverParent = grandChild;
							break;
						}
					}
				}

				// It is not assumed that child.containerEl.parentElement is null, but if it is,
				// use child.containerEl and its child element.
				this.updateNavigation(
					child,
					child.containerEl.parentElement ?? child.containerEl,
					child.containerEl.parentElement
						? child.containerEl
						: child.containerEl.querySelector(
								".markdown-embed-content"
						  ),
					child.file,
					hoverParent,
					false
				);
			}
		}
	}

	/**
	 * Adds the navigation component to the specified element.
	 * Updates it if the component already exists.
	 * @param parent The parent component to add the navigation component to.
	 * @param container The container element to add the navigation links to.
	 * @param nextSibling The element to add the navigation links before.
	 * @param file The file object currently opened in the parent component.
	 * @param hoverParent The parent component to add the hover popover to.
	 * @param forced See `NavigationComponent.update`.
	 */
	private updateNavigation(
		parent: Component,
		container: Element,
		nextSibling: Element | null,
		file: TFile,
		hoverParent: Component,
		forced: boolean
	): void {
		let navigation = container.querySelector(".nav-link-header-navigation");

		// Creates a new element for the navigation links, if not already added.
		if (!navigation) {
			navigation = container.createDiv({
				cls: "nav-link-header-navigation",
			});
			if (nextSibling) {
				container.insertBefore(navigation, nextSibling);
			}

			parent.addChild(new NavigationComponent(this, navigation));
		}

		if ("_children" in parent && parent._children instanceof Array) {
			for (const child of parent._children) {
				if (child instanceof NavigationComponent) {
					void child.update(file, hoverParent, forced);
					break;
				}
			}
		}
	}

	/**
	 * Cleans up the plugin.
	 */
	public onunload(): void {
		this.layoutReady = false;

		this.periodicNotesManager = undefined;

		// Disconnects all observers.
		for (const observer of this.observers.values()) {
			observer.disconnect();
		}
		this.observers.clear();

		if (this.updateDebounceTimer) {
			window.clearTimeout(this.updateDebounceTimer);
			this.updateDebounceTimer = undefined;
		}

		this.app.workspace.iterateAllLeaves((leaf) => {
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
