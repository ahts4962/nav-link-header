import { PluginSettingTab, Setting } from "obsidian";
import type NavLinkHeader from "./main";

export interface NavLinkHeaderSettings {
	annotatedLinksEnabled: boolean;
	annotationStrings: string;
	dailyNoteLinksEnabled: boolean;
	weeklyNoteLinksEnabled: boolean;
	monthlyNoteLinksEnabled: boolean;
	quarterlyNoteLinksEnabled: boolean;
	yearlyNoteLinksEnabled: boolean;
}

export const DEFAULT_SETTINGS: NavLinkHeaderSettings = {
	annotatedLinksEnabled: false,
	annotationStrings: "",
	dailyNoteLinksEnabled: false,
	weeklyNoteLinksEnabled: false,
	monthlyNoteLinksEnabled: false,
	quarterlyNoteLinksEnabled: false,
	yearlyNoteLinksEnabled: false,
};

export class NavLinkHeaderSettingTab extends PluginSettingTab {
	constructor(private plugin: NavLinkHeader) {
		super(plugin.app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Enable annotated links")
			.setDesc(
				"Display annotated backlinks in the navigation. " +
					"If one of the annotation strings is placed immediately " +
					"before a link, the link is recognized as an annotated link. " +
					"Notes with annotated links appear as backlinks at the top of the " +
					"destination note. "
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings!.annotatedLinksEnabled)
					.onChange(async (value) => {
						this.plugin.settings!.annotatedLinksEnabled = value;
						this.plugin.app.workspace.trigger(
							"nav-link-header:settings-changed"
						);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Annotation strings")
			.setDesc(
				"Define the annotation strings. " +
					"Any string, including emoji, is acceptable as an annotation " +
					"string. To specify multiple annotations, separate them with commas."
			)
			.addText((text) => {
				text.setValue(this.plugin.settings!.annotationStrings).onChange(
					async (value) => {
						this.plugin.settings!.annotationStrings = value;
						this.plugin.app.workspace.trigger(
							"nav-link-header:settings-changed"
						);
						await this.plugin.saveSettings();
					}
				);
			});

		new Setting(containerEl)
			.setName("Enable daily note links")
			.setDesc("Display links to adjacent daily notes.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings!.dailyNoteLinksEnabled)
					.onChange(async (value) => {
						this.plugin.settings!.dailyNoteLinksEnabled = value;
						this.plugin.app.workspace.trigger(
							"nav-link-header:settings-changed"
						);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Enable weekly note links")
			.setDesc("Display links to adjacent weekly notes.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings!.weeklyNoteLinksEnabled)
					.onChange(async (value) => {
						this.plugin.settings!.weeklyNoteLinksEnabled = value;
						this.plugin.app.workspace.trigger(
							"nav-link-header:settings-changed"
						);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Enable monthly note links")
			.setDesc("Display links to adjacent monthly notes.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings!.monthlyNoteLinksEnabled)
					.onChange(async (value) => {
						this.plugin.settings!.monthlyNoteLinksEnabled = value;
						this.plugin.app.workspace.trigger(
							"nav-link-header:settings-changed"
						);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Enable quarterly note links")
			.setDesc("Display links to adjacent quarterly notes.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings!.quarterlyNoteLinksEnabled)
					.onChange(async (value) => {
						this.plugin.settings!.quarterlyNoteLinksEnabled = value;
						this.plugin.app.workspace.trigger(
							"nav-link-header:settings-changed"
						);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Enable yearly note links")
			.setDesc("Display links to adjacent yearly notes.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings!.yearlyNoteLinksEnabled)
					.onChange(async (value) => {
						this.plugin.settings!.yearlyNoteLinksEnabled = value;
						this.plugin.app.workspace.trigger(
							"nav-link-header:settings-changed"
						);
						await this.plugin.saveSettings();
					});
			});
	}
}
