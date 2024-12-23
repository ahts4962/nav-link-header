import { PluginSettingTab, Setting } from "obsidian";
import type NavLinkHeader from "./main";

export interface NavLinkHeaderSettings {
	displayInMarkdownViews: boolean;
	displayInHoverPopovers: boolean;
	annotatedLinksEnabled: boolean;
	annotationStrings: string;
	allowSpaceAfterAnnotationString: boolean;
	dailyNoteLinksEnabled: boolean;
	weeklyNoteLinksEnabled: boolean;
	monthlyNoteLinksEnabled: boolean;
	quarterlyNoteLinksEnabled: boolean;
	yearlyNoteLinksEnabled: boolean;
	displayPlaceholder: boolean;
	confirmFileCreation: boolean;
	propertyMappings: Array<{property: string, emoji: string}>;
	filterDuplicateNotes: boolean;
	usePropertyAsDisplayName: boolean;
	displayPropertyName: string;
	devMode: boolean;
}

export const DEFAULT_SETTINGS: NavLinkHeaderSettings = {
	displayInMarkdownViews: true,
	displayInHoverPopovers: true,
	annotatedLinksEnabled: false,
	annotationStrings: "",
	allowSpaceAfterAnnotationString: false,
	dailyNoteLinksEnabled: false,
	weeklyNoteLinksEnabled: false,
	monthlyNoteLinksEnabled: false,
	quarterlyNoteLinksEnabled: false,
	yearlyNoteLinksEnabled: false,
	displayPlaceholder: false,
	confirmFileCreation: true,
	propertyMappings: [{property: "up", emoji: "⬆️"}],
	filterDuplicateNotes: true,
	usePropertyAsDisplayName: false,
	displayPropertyName: "title",
	devMode: false,
};

export class NavLinkHeaderSettingTab extends PluginSettingTab {
	constructor(private plugin: NavLinkHeader) {
		super(plugin.app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Display navigation links in each view")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings!.displayInMarkdownViews)
					.onChange(async (value) => {
						this.plugin.settings!.displayInMarkdownViews = value;
						this.plugin.app.workspace.trigger(
							"nav-link-header:settings-changed"
						);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Display navigation links in page preview")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings!.displayInHoverPopovers)
					.onChange(async (value) => {
						this.plugin.settings!.displayInHoverPopovers = value;
						this.plugin.app.workspace.trigger(
							"nav-link-header:settings-changed"
						);
						await this.plugin.saveSettings();
					});
			});

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
					"Any string, including emoji, is acceptable as long as " +
					"the following link is recognized as a backlink. " +
					"To specify multiple annotations, separate them with commas."
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
			.setName("Allow a space between the annotation string and the link")
			.setDesc(
				"Even if there is a space between the annotation string and the link, " +
					"the link is still recognized as an annotated link."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(
						this.plugin.settings!.allowSpaceAfterAnnotationString
					)
					.onChange(async (value) => {
						this.plugin.settings!.allowSpaceAfterAnnotationString =
							value;
						this.plugin.app.workspace.trigger(
							"nav-link-header:settings-changed"
						);
						await this.plugin.saveSettings();
					});
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

		new Setting(containerEl)
			.setName("Display placeholder")
			.setDesc(
				"Display a placeholder when there is nothing to display. " +
					"This prevents the contents of the view from being " +
					"rattled when the link is loaded."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings!.displayPlaceholder)
					.onChange(async (value) => {
						this.plugin.settings!.displayPlaceholder = value;
						this.plugin.app.workspace.trigger(
							"nav-link-header:settings-changed"
						);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Confirm when creating a new file")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings!.confirmFileCreation)
					.onChange(async (value) => {
						this.plugin.settings!.confirmFileCreation = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Property mappings")
			.setDesc(
				"Define the property mappings. " +
					"Each mapping consists of a property and an emoji. " +
					"Each line should be in the format 'property:emoji'."
			)
			.addTextArea((text) => {
				const mappings = this.plugin.settings!.propertyMappings
					.map((mapping) => `${mapping.property}:${mapping.emoji}`)
					.join("\n");
				text.setValue(mappings)
					.setPlaceholder("up:⬆️\nparent:👆\nsource:📚")
					.onChange(async (value) => {
						const newMappings = value.split("\n")
							.map(line => line.trim())
							.filter(line => line.length > 0)
							.map((mapping) => {
								const [property, emoji] = mapping.split(":");
								return { property: property.trim(), emoji: emoji?.trim() || "⬆️" };
							});
						this.plugin.settings!.propertyMappings = newMappings;
						this.plugin.app.workspace.trigger(
							"nav-link-header:settings-changed"
						);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Filter duplicate notes")
			.setDesc("Filter out duplicate notes in the navigation.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings!.filterDuplicateNotes)
					.onChange(async (value) => {
						this.plugin.settings!.filterDuplicateNotes = value;
						this.plugin.app.workspace.trigger(
							"nav-link-header:settings-changed"
						);
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Use property as display name")
			.setDesc(
				"Use the property value as the display name for property links."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings!.usePropertyAsDisplayName)
					.onChange(async (value) => {
						this.plugin.settings!.usePropertyAsDisplayName = value;
						this.plugin.app.workspace.trigger(
							"nav-link-header:settings-changed"
						);
						await this.plugin.saveSettings();
						// Force refresh the settings panel to show/hide the property name setting
						this.display();
					});
			});

		if (this.plugin.settings!.usePropertyAsDisplayName) {
			new Setting(containerEl)
				.setName("Display property name")
				.setDesc(
					"The property name to display for property links. " +
						"If left blank, the property name will not be displayed."
				)
				.addText((text) => {
					text
						.setValue(this.plugin.settings!.displayPropertyName)
						.onChange(
							async (value) => {
								this.plugin.settings!.displayPropertyName = value;
								this.plugin.app.workspace.trigger(
									"nav-link-header:settings-changed"
								);
								await this.plugin.saveSettings();
							}
						);
				});
		}

		new Setting(containerEl)
			.setName("Development mode")
			.setDesc("Enable development mode for debugging purposes.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings!.devMode)
					.onChange(async (value) => {
						this.plugin.settings!.devMode = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
