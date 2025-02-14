import { debounce, Plugin, type HoverParent } from "obsidian";
import { HoverPopoverUpdater } from "./hoverPopoverUpdater";
import { MarkdownViewUpdater } from "./markdownViewUpdater";
import { AnnotatedLinksManager } from "./annotatedLink";
import { getActiveGranularities, PeriodicNotesManager } from "./periodicNotes";
import {
	cloneSettings,
	loadSettings,
	NavLinkHeaderSettingTab,
	type NavLinkHeaderSettings,
} from "./settings";

export default class NavLinkHeader extends Plugin {
	private markdownViewUpdater?: MarkdownViewUpdater;
	private hoverPopoverUpdater?: HoverPopoverUpdater;
	public annotatedLinksManager?: AnnotatedLinksManager;
	public periodicNotesManager?: PeriodicNotesManager;

	public settings?: NavLinkHeaderSettings;
	public settingsUnderChange?: NavLinkHeaderSettings;

	public onload(): void {
		void this.initialize();
	}

	private async initialize(): Promise<void> {
		await loadSettings(this);

		this.addSettingTab(new NavLinkHeaderSettingTab(this));

		this.addCommand({
			id: "open-previous-periodic-note",
			name: "Open previous periodic note",
			checkCallback: (checking: boolean) => {
				if (!this.periodicNotesManager) {
					return false;
				}

				const file = this.app.workspace.getActiveFile();
				if (!file) {
					return false;
				}

				const adjacentNotes =
					this.periodicNotesManager.searchAdjacentNotes(file);
				if (!adjacentNotes?.previousPath) {
					return false;
				}

				if (!checking) {
					void this.app.workspace.openLinkText(
						adjacentNotes.previousPath,
						file.path
					);
				}

				return true;
			},
		});

		this.addCommand({
			id: "open-next-periodic-note",
			name: "Open next periodic note",
			checkCallback: (checking: boolean) => {
				if (!this.periodicNotesManager) {
					return false;
				}

				const file = this.app.workspace.getActiveFile();
				if (!file) {
					return false;
				}

				const adjacentNotes =
					this.periodicNotesManager.searchAdjacentNotes(file);
				if (!adjacentNotes?.nextPath) {
					return false;
				}

				if (!checking) {
					void this.app.workspace.openLinkText(
						adjacentNotes.nextPath,
						file.path
					);
				}

				return true;
			},
		});

		this.addCommand({
			id: "open-parent-periodic-note",
			name: "Open parent periodic note",
			checkCallback: (checking: boolean) => {
				if (!this.periodicNotesManager) {
					return false;
				}

				const file = this.app.workspace.getActiveFile();
				if (!file) {
					return false;
				}

				const adjacentNotes =
					this.periodicNotesManager.searchAdjacentNotes(file);
				if (!adjacentNotes) {
					return false;
				}
				if (
					!adjacentNotes.parentPath ||
					adjacentNotes.parentDate !== undefined
				) {
					return false;
				}

				if (!checking) {
					void this.app.workspace.openLinkText(
						adjacentNotes.parentPath,
						file.path
					);
				}

				return true;
			},
		});

		this.app.workspace.onLayoutReady(() => {
			if (this.settings!.displayInMarkdownViews) {
				this.markdownViewUpdater = new MarkdownViewUpdater(this);
			}

			if (this.settings!.displayInHoverPopovers) {
				this.hoverPopoverUpdater = new HoverPopoverUpdater(this);
			}

			if (this.settings!.annotationStrings.length > 0) {
				this.annotatedLinksManager = new AnnotatedLinksManager(this);
			}

			if (this.periodicNotesActive) {
				this.periodicNotesManager = new PeriodicNotesManager(this);
			}

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
					this.markdownViewUpdater?.onVaultChange();
				})
			);

			this.registerEvent(
				this.app.vault.on("delete", (file) => {
					this.annotatedLinksManager?.onFileDeleted(file);
					this.periodicNotesManager?.onFileDeleted(file);
					this.markdownViewUpdater?.onVaultChange();
				})
			);

			this.registerEvent(
				this.app.vault.on("rename", (file, oldPath) => {
					this.annotatedLinksManager?.onFileRenamed(file, oldPath);
					this.periodicNotesManager?.onFileRenamed(file, oldPath);
					this.markdownViewUpdater?.onVaultChange();
				})
			);

			this.registerEvent(
				this.app.vault.on("modify", (file) => {
					this.annotatedLinksManager?.onFileModified(file);
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
		});
	}

	public triggerSettingsChangedEvent(): void {
		this.app.workspace.trigger("nav-link-header:settings-changed");
	}

	public get periodicNotesActive(): boolean {
		return getActiveGranularities(this.settings!, false).length > 0;
	}

	private onSettingsChange = debounce(
		async () => {
			const previousSettings = this.settings!;
			this.settings = cloneSettings(this.settingsUnderChange!);

			if (
				!previousSettings.displayInMarkdownViews &&
				this.settings.displayInMarkdownViews
			) {
				this.markdownViewUpdater = new MarkdownViewUpdater(this);
			} else if (
				previousSettings.displayInMarkdownViews &&
				!this.settings.displayInMarkdownViews
			) {
				this.markdownViewUpdater?.dispose();
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
				this.hoverPopoverUpdater?.dispose();
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
			}
			if (this.annotatedLinksManager) {
				if (
					previousSettings.annotationStrings.length !==
						this.settings.annotationStrings.length ||
					previousSettings.allowSpaceAfterAnnotationString !==
						this.settings.allowSpaceAfterAnnotationString
				)
					this.annotatedLinksManager.clearCache();
			}

			if (this.periodicNotesActive && !this.periodicNotesManager) {
				this.periodicNotesManager = new PeriodicNotesManager(this);
			} else if (!this.periodicNotesActive && this.periodicNotesManager) {
				this.periodicNotesManager = undefined;
			} else if (
				previousSettings.prevNextLinksEnabledInDailyNotes !==
					this.settings.prevNextLinksEnabledInDailyNotes ||
				previousSettings.prevNextLinksEnabledInWeeklyNotes !==
					this.settings.prevNextLinksEnabledInWeeklyNotes ||
				previousSettings.prevNextLinksEnabledInMonthlyNotes !==
					this.settings.prevNextLinksEnabledInMonthlyNotes ||
				previousSettings.prevNextLinksEnabledInQuarterlyNotes !==
					this.settings.prevNextLinksEnabledInQuarterlyNotes ||
				previousSettings.prevNextLinksEnabledInYearlyNotes !==
					this.settings.prevNextLinksEnabledInYearlyNotes ||
				previousSettings.parentLinkGranularityInDailyNotes !==
					this.settings.parentLinkGranularityInDailyNotes ||
				previousSettings.parentLinkGranularityInWeeklyNotes !==
					this.settings.parentLinkGranularityInWeeklyNotes ||
				previousSettings.parentLinkGranularityInMonthlyNotes !==
					this.settings.parentLinkGranularityInMonthlyNotes ||
				previousSettings.parentLinkGranularityInQuarterlyNotes !==
					this.settings.parentLinkGranularityInQuarterlyNotes
			) {
				this.periodicNotesManager?.updateEntireCache();
			}

			this.markdownViewUpdater?.onSettingsChange();

			await this.saveData(this.settings);
		},
		500,
		true
	);

	private onPeriodicNotesSettingsChange = debounce(
		() => {
			if (this.periodicNotesActive && !this.periodicNotesManager) {
				this.periodicNotesManager = new PeriodicNotesManager(this);
			} else if (!this.periodicNotesActive && this.periodicNotesManager) {
				this.periodicNotesManager = undefined;
			} else {
				this.periodicNotesManager?.updateEntireCache();
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
	}
}
