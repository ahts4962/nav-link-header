import { PluginSettingTab, Setting } from "obsidian";
import type NavLinkHeader from "./main";

export interface NavLinkHeaderSettings {
	annotatedLinksEnabled: boolean;
	annotationStrings: string;
}

export const DEFAULT_SETTINGS: NavLinkHeaderSettings = {
	annotatedLinksEnabled: false,
	annotationStrings: "",
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
			.setDesc("Display annotated backlinks in the navigation.")
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
					"If one of the specified annotation strings is placed immediately " +
					"before the link, the link is recognized as an annotated link. " +
					"Notes with annotated links appear as backlinks at the top of the " +
					"destination note. " +
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
	}
}
