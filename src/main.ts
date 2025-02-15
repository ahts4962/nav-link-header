import { debounce, Plugin, type HoverParent } from "obsidian";
import { MarkdownViewUpdater } from "./markdownViewUpdater";
import { HoverPopoverUpdater } from "./hoverPopoverUpdater";
import { AnnotatedLinksManager } from "./annotatedLink";
import { getActiveGranularities, PeriodicNotesManager } from "./periodicNotes";
import { FolderLinksManager } from "./folderLink";
import { addCommands } from "./commands";
import {
	loadSettings,
	NavLinkHeaderSettingTab,
	type NavLinkHeaderSettings,
} from "./settings";
import { deepCopy, deepEqual } from "./utils";

export default class NavLinkHeader extends Plugin {
	private markdownViewUpdater?: MarkdownViewUpdater;
	private hoverPopoverUpdater?: HoverPopoverUpdater;
	public annotatedLinksManager?: AnnotatedLinksManager;
	public periodicNotesManager?: PeriodicNotesManager;
	public folderLinksManagers: FolderLinksManager[] = [];

	// The currently applied settings.
	public settings?: NavLinkHeaderSettings;

	// The settings that are being changed.
	// Change this in the settings page, etc., and apply it to `this.settings`
	// by calling `this.triggerSettingsChangedEvent`.
	public settingsUnderChange?: NavLinkHeaderSettings;

	public onload(): void {
		void this.initialize();
	}

	private async initialize(): Promise<void> {
		await loadSettings(this);
		this.addSettingTab(new NavLinkHeaderSettingTab(this));

		addCommands(this);

		this.app.workspace.onLayoutReady(() => {
			this.activateComponents();
			this.registerEvents();
		});
	}

	private activateComponents(): void {
		if (this.settings!.displayInMarkdownViews) {
			this.markdownViewUpdater = new MarkdownViewUpdater(this);
		}

		if (this.settings!.displayInHoverPopovers) {
			this.hoverPopoverUpdater = new HoverPopoverUpdater(this);
		}

		if (this.settings!.annotationStrings.length > 0) {
			this.annotatedLinksManager = new AnnotatedLinksManager(this);
		}

		if (this.periodicNotesEnabled) {
			this.periodicNotesManager = new PeriodicNotesManager(this);
		}

		const length = this.settings!.folderLinksSettingsArray.length;
		if (length > 0) {
			for (let i = 0; i < length; i++) {
				this.folderLinksManagers.push(new FolderLinksManager(this, i));
			}
		}
	}

	private registerEvents(): void {
		this.registerEvent(
			this.app.workspace.on("window-open", (window) => {
				this.hoverPopoverUpdater?.onWindowOpen(window);
			})
		);

		this.registerEvent(
			this.app.workspace.on("window-close", (window) => {
				this.hoverPopoverUpdater?.onWindowClose(window);
			})
		);

		this.registerEvent(
			// @ts-expect-error: hover-link event is not exposed explicitly.
			this.app.workspace.on("hover-link", ({ hoverParent }) => {
				this.hoverPopoverUpdater?.onHoverLink(
					hoverParent as HoverParent
				);
			})
		);

		// Registers the hover link source for the hover popover.
		this.registerHoverLinkSource("nav-link-header", {
			defaultMod: true,
			display: "Nav Link Header",
		});

		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				this.markdownViewUpdater?.onLayoutChange();
			})
		);

		this.registerEvent(
			this.app.vault.on("create", (file) => {
				this.periodicNotesManager?.onFileCreated(file);
				this.folderLinksManagers.forEach((manager) => {
					manager.onFileCreated(file);
				});
				this.markdownViewUpdater?.onVaultChange();
			})
		);

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				this.annotatedLinksManager?.onFileDeleted(file);
				this.periodicNotesManager?.onFileDeleted(file);
				this.folderLinksManagers.forEach((manager) => {
					manager.onFileDeleted(file);
				});
				this.markdownViewUpdater?.onVaultChange();
			})
		);

		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				this.annotatedLinksManager?.onFileRenamed(file, oldPath);
				this.periodicNotesManager?.onFileRenamed(file, oldPath);
				this.folderLinksManagers.forEach((manager) => {
					manager.onFileRenamed(file, oldPath);
				});
				this.markdownViewUpdater?.onVaultChange();
			})
		);

		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				this.annotatedLinksManager?.onFileModified(file);
				this.folderLinksManagers.forEach((manager) => {
					manager.onFileModified(file);
				});
				this.markdownViewUpdater?.onVaultChange();
			})
		);

		this.registerEvent(
			this.app.workspace.on(
				// @ts-expect-error: custom event.
				"nav-link-header:settings-changed",
				() => {
					this.onSettingsChange();
				}
			)
		);

		this.registerEvent(
			this.app.workspace.on(
				// @ts-expect-error: custom event.
				"periodic-notes:settings-updated",
				() => {
					this.onPeriodicNotesSettingsChange();
				}
			)
		);
	}

	/**
	 * Call this method to apply the settings changes.
	 * This method can be called many times in a short period of time because
	 * the application of settings is debounced.
	 */
	public triggerSettingsChangedEvent(): void {
		this.app.workspace.trigger("nav-link-header:settings-changed");
	}

	/**
	 * Refers to the settings of this plugin and the Periodic Notes plugin, and
	 * returns `true` if any of the periodic note links are enabled.
	 */
	public get periodicNotesEnabled(): boolean {
		return getActiveGranularities(this.settings!, false).length > 0;
	}

	private onSettingsChange = debounce(
		async () => {
			const previousSettings = this.settings!;
			this.settings = deepCopy(this.settingsUnderChange!);

			// Update the state of the components.
			if (
				!previousSettings.displayInMarkdownViews &&
				this.settings.displayInMarkdownViews
			) {
				this.markdownViewUpdater = new MarkdownViewUpdater(this);
			} else if (
				previousSettings.displayInMarkdownViews &&
				!this.settings.displayInMarkdownViews
			) {
				this.markdownViewUpdater!.dispose();
				this.markdownViewUpdater = undefined;
			}

			if (
				!previousSettings.displayInHoverPopovers &&
				this.settings.displayInHoverPopovers
			) {
				this.hoverPopoverUpdater = new HoverPopoverUpdater(this);
			} else if (
				previousSettings.displayInHoverPopovers &&
				!this.settings.displayInHoverPopovers
			) {
				this.hoverPopoverUpdater!.dispose();
				this.hoverPopoverUpdater = undefined;
			}

			if (
				previousSettings.annotationStrings.length === 0 &&
				this.settings.annotationStrings.length > 0
			) {
				this.annotatedLinksManager = new AnnotatedLinksManager(this);
			} else if (
				previousSettings.annotationStrings.length > 0 &&
				this.settings.annotationStrings.length === 0
			) {
				this.annotatedLinksManager = undefined;
			} else if (this.annotatedLinksManager) {
				const keys: (keyof NavLinkHeaderSettings)[] = [
					"annotationStrings",
					"allowSpaceAfterAnnotationString",
				];
				const changed = keys.some(
					(key) =>
						!deepEqual(previousSettings[key], this.settings![key])
				);
				if (changed)
					this.annotatedLinksManager = new AnnotatedLinksManager(
						this
					);
			}

			if (this.periodicNotesEnabled && !this.periodicNotesManager) {
				this.periodicNotesManager = new PeriodicNotesManager(this);
			} else if (
				!this.periodicNotesEnabled &&
				this.periodicNotesManager
			) {
				this.periodicNotesManager = undefined;
			} else if (this.periodicNotesManager) {
				const keys: (keyof NavLinkHeaderSettings)[] = [
					"prevNextLinksEnabledInDailyNotes",
					"prevNextLinksEnabledInWeeklyNotes",
					"prevNextLinksEnabledInMonthlyNotes",
					"prevNextLinksEnabledInQuarterlyNotes",
					"prevNextLinksEnabledInYearlyNotes",
					"parentLinkGranularityInDailyNotes",
					"parentLinkGranularityInWeeklyNotes",
					"parentLinkGranularityInMonthlyNotes",
					"parentLinkGranularityInQuarterlyNotes",
				];
				const changed = keys.some(
					(key) =>
						!deepEqual(previousSettings[key], this.settings![key])
				);
				if (changed) {
					this.periodicNotesManager = new PeriodicNotesManager(this);
				}
			}

			if (
				previousSettings.folderLinksSettingsArray.length !==
				this.settings.folderLinksSettingsArray.length
			) {
				this.folderLinksManagers = [];
				const length = this.settings.folderLinksSettingsArray.length;
				for (let i = 0; i < length; i++) {
					this.folderLinksManagers.push(
						new FolderLinksManager(this, i)
					);
				}
			} else {
				const length = this.settings.folderLinksSettingsArray.length;
				for (let i = 0; i < length; i++) {
					const previous =
						previousSettings.folderLinksSettingsArray[i];
					const current = this.settings.folderLinksSettingsArray[i];
					if (!deepEqual(previous, current)) {
						this.folderLinksManagers[i] = new FolderLinksManager(
							this,
							i
						);
					}
				}
			}

			this.markdownViewUpdater?.onSettingsChange();

			await this.saveData(this.settings);
		},
		500,
		true
	);

	private onPeriodicNotesSettingsChange = debounce(
		() => {
			if (this.periodicNotesEnabled && !this.periodicNotesManager) {
				this.periodicNotesManager = new PeriodicNotesManager(this);
			} else if (
				!this.periodicNotesEnabled &&
				this.periodicNotesManager
			) {
				this.periodicNotesManager = undefined;
			} else if (this.periodicNotesManager) {
				this.periodicNotesManager = new PeriodicNotesManager(this);
			}

			this.markdownViewUpdater?.onSettingsChange();
		},
		500,
		true
	);

	/**
	 * Cleans up the plugin.
	 */
	public onunload(): void {
		this.onSettingsChange.cancel();
		void this.saveData(this.settingsUnderChange);

		if (this.markdownViewUpdater) {
			this.markdownViewUpdater.dispose();
			this.markdownViewUpdater = undefined;
		}

		if (this.hoverPopoverUpdater) {
			this.hoverPopoverUpdater.dispose();
			this.hoverPopoverUpdater = undefined;
		}

		this.annotatedLinksManager = undefined;
		this.periodicNotesManager = undefined;
		this.folderLinksManagers = [];
	}
}
