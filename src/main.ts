import { Plugin, type HoverParent } from "obsidian";
import { HoverPopoverUpdater } from "./hoverPopoverUpdater";
import { MarkdownViewUpdater } from "./markdownViewUpdater";
import { PeriodicNotesManager } from "./periodicNotes";
import {
	DEFAULT_SETTINGS,
	NavLinkHeaderSettingTab,
	type NavLinkHeaderSettings,
} from "./settings";
import { Debouncer } from "./utils";

export default class NavLinkHeader extends Plugin {
	private markdownViewUpdater?: MarkdownViewUpdater;
	private hoverPopoverUpdater?: HoverPopoverUpdater;
	public periodicNotesManager?: PeriodicNotesManager;

	public settings?: NavLinkHeaderSettings;
	private debouncer: Debouncer = new Debouncer(1000);

	public onload(): void {
		void this.initialize();
	}

	private async initialize(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new NavLinkHeaderSettingTab(this));

		this.app.workspace.onLayoutReady(() => {
			this.markdownViewUpdater = new MarkdownViewUpdater(this);
			this.hoverPopoverUpdater = new HoverPopoverUpdater(this);

			if (this.periodicNotesEnabled) {
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
					this.periodicNotesManager?.onFileDeleted(file);
					this.markdownViewUpdater?.onVaultChange();
				})
			);

			this.registerEvent(
				this.app.vault.on("rename", (file, oldPath) => {
					this.periodicNotesManager?.onFileRenamed(file, oldPath);
					this.markdownViewUpdater?.onVaultChange();
				})
			);

			this.registerEvent(
				this.app.vault.on("modify", () => {
					this.markdownViewUpdater?.onVaultChange();
				})
			);

			const onSettingsChange = () => {
				if (this.periodicNotesManager) {
					this.debouncer.run(() => {
						this.periodicNotesManager?.updateEntireCache();
						this.markdownViewUpdater?.onVaultChange();
					});
				}
				this.markdownViewUpdater?.onSettingsChange();
			};

			this.registerEvent(
				this.app.workspace.on(
					// @ts-expect-error: custom event.
					"nav-link-header:settings-changed",
					onSettingsChange
				)
			);

			this.registerEvent(
				this.app.workspace.on(
					// @ts-expect-error: custom event.
					"periodic-notes:settings-updated",
					onSettingsChange
				)
			);
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
	 * Cleans up the plugin.
	 */
	public onunload(): void {
		this.debouncer.cancel();

		if (this.markdownViewUpdater) {
			this.markdownViewUpdater.dispose();
			this.markdownViewUpdater = undefined;

			if (this.hoverPopoverUpdater) {
				this.hoverPopoverUpdater.dispose();
				this.hoverPopoverUpdater = undefined;
			}

			this.periodicNotesManager = undefined;
		}
	}
}
