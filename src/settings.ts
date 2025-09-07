import { normalizePath, PluginSettingTab, Setting } from "obsidian";
import type { IGranularity } from "obsidian-daily-notes-interface";
import NavLinkHeader from "./main";
import { deepCopy } from "./utils";

// When adding properties to these interfaces, see also `NavLinkHeader.onSettingsChange`.
export interface NavLinkHeaderSettings {
  displayInMarkdownViews: boolean;
  displayInHoverPopovers: boolean;
  displayOrderOfLinks: string[];
  propertyNameForDisplayText: string;
  filterDuplicateNotes: boolean;
  duplicateNoteFilteringPriority: string[];
  displayPlaceholder: boolean;
  confirmFileCreation: boolean;
  annotationStrings: string[];
  allowSpaceAfterAnnotationString: boolean;
  ignoreVariationSelectors: boolean;
  propertyMappings: { property: string; prefix: string }[];
  prevNextLinksEnabledInDailyNotes: boolean;
  parentLinkGranularityInDailyNotes: IGranularity | undefined;
  prevNextLinksEnabledInWeeklyNotes: boolean;
  parentLinkGranularityInWeeklyNotes: IGranularity | undefined;
  prevNextLinksEnabledInMonthlyNotes: boolean;
  parentLinkGranularityInMonthlyNotes: IGranularity | undefined;
  prevNextLinksEnabledInQuarterlyNotes: boolean;
  parentLinkGranularityInQuarterlyNotes: IGranularity | undefined;
  prevNextLinksEnabledInYearlyNotes: boolean;
  previousLinkProperty: string;
  nextLinkProperty: string;
  parentLinkProperty: string;
  folderLinksSettingsArray: FolderLinksSettings[];
}

export interface FolderLinksSettings {
  folderPath: string;
  recursive: boolean;
  filterRegex: string;
  filterBy: "filename" | "property";
  filterPropertyName: string;
  sortOrder: "asc" | "desc";
  sortBy: "filename" | "created" | "modified" | "property";
  sortPropertyName: string;
  parentPath: string;
}

const DEFAULT_SETTINGS: NavLinkHeaderSettings = {
  displayInMarkdownViews: true,
  displayInHoverPopovers: true,
  displayOrderOfLinks: [],
  propertyNameForDisplayText: "",
  filterDuplicateNotes: true,
  duplicateNoteFilteringPriority: [],
  displayPlaceholder: false,
  confirmFileCreation: true,
  annotationStrings: [],
  allowSpaceAfterAnnotationString: false,
  ignoreVariationSelectors: false,
  propertyMappings: [],
  prevNextLinksEnabledInDailyNotes: false,
  parentLinkGranularityInDailyNotes: undefined,
  prevNextLinksEnabledInWeeklyNotes: false,
  parentLinkGranularityInWeeklyNotes: undefined,
  prevNextLinksEnabledInMonthlyNotes: false,
  parentLinkGranularityInMonthlyNotes: undefined,
  prevNextLinksEnabledInQuarterlyNotes: false,
  parentLinkGranularityInQuarterlyNotes: undefined,
  prevNextLinksEnabledInYearlyNotes: false,
  previousLinkProperty: "",
  nextLinkProperty: "",
  parentLinkProperty: "",
  folderLinksSettingsArray: [],
};

const DEFAULT_FOLDER_LINKS_SETTINGS: FolderLinksSettings = {
  folderPath: "",
  recursive: false,
  filterRegex: "",
  filterBy: "filename",
  filterPropertyName: "",
  sortOrder: "asc",
  sortBy: "filename",
  sortPropertyName: "",
  parentPath: "",
};

export async function loadSettings(plugin: NavLinkHeader): Promise<void> {
  const result = {} as Record<keyof NavLinkHeaderSettings, unknown>;
  const loadedData = ((await plugin.loadData()) ?? {}) as Record<string, unknown>;

  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof NavLinkHeaderSettings)[]) {
    // Migration from old settings.
    if (
      key === "displayOrderOfLinks" &&
      "annotatedLinksEnabled" in loadedData &&
      loadedData["annotatedLinksEnabled"] &&
      "annotationStrings" in loadedData &&
      typeof loadedData["annotationStrings"] === "string"
    ) {
      result[key] = parsePrefixStrings(loadedData["annotationStrings"]);
      continue;
    }

    if (
      key === "propertyNameForDisplayText" &&
      "usePropertyAsDisplayName" in loadedData &&
      loadedData["usePropertyAsDisplayName"] &&
      "displayPropertyName" in loadedData
    ) {
      result[key] = loadedData["displayPropertyName"];
      continue;
    }

    if (
      key === "annotationStrings" &&
      "annotatedLinksEnabled" in loadedData &&
      loadedData["annotatedLinksEnabled"] &&
      key in loadedData &&
      typeof loadedData[key] === "string"
    ) {
      result[key] = parsePrefixStrings(loadedData[key]);
      continue;
    }

    if (
      key === "propertyMappings" &&
      key in loadedData &&
      loadedData[key] instanceof Array &&
      loadedData[key].length > 0 &&
      "emoji" in loadedData[key][0]
    ) {
      result[key] = loadedData[key]
        .map((item: object) => {
          if ("property" in item && "emoji" in item) {
            return {
              property: item.property as string,
              prefix: item.emoji as string,
            };
          } else {
            return {
              property: "",
              prefix: "",
            };
          }
        })
        .filter((item) => item.property.length > 0 && item.prefix.length > 0);
      continue;
    }

    if (key === "prevNextLinksEnabledInDailyNotes" && "dailyNoteLinksEnabled" in loadedData) {
      result[key] = loadedData["dailyNoteLinksEnabled"];
      continue;
    }

    if (key === "prevNextLinksEnabledInWeeklyNotes" && "weeklyNoteLinksEnabled" in loadedData) {
      result[key] = loadedData["weeklyNoteLinksEnabled"];
      continue;
    }

    if (key === "prevNextLinksEnabledInMonthlyNotes" && "monthlyNoteLinksEnabled" in loadedData) {
      result[key] = loadedData["monthlyNoteLinksEnabled"];
      continue;
    }

    if (
      key === "prevNextLinksEnabledInQuarterlyNotes" &&
      "quarterlyNoteLinksEnabled" in loadedData
    ) {
      result[key] = loadedData["quarterlyNoteLinksEnabled"];
      continue;
    }

    if (key === "prevNextLinksEnabledInYearlyNotes" && "yearlyNoteLinksEnabled" in loadedData) {
      result[key] = loadedData["yearlyNoteLinksEnabled"];
      continue;
    }

    // Apply default values if not found in loaded data.
    if (key in loadedData) {
      if (key === "folderLinksSettingsArray") {
        if (Array.isArray(loadedData[key])) {
          const resultArray: FolderLinksSettings[] = [];
          for (let i = 0; i < loadedData[key].length; i++) {
            const subResult = {} as Record<keyof FolderLinksSettings, unknown>;
            const loadedFolderLinksSettings = loadedData[key][i] as Record<string, unknown>;
            for (const subKey of Object.keys(
              DEFAULT_FOLDER_LINKS_SETTINGS
            ) as (keyof FolderLinksSettings)[]) {
              if (subKey in loadedFolderLinksSettings) {
                subResult[subKey] = loadedFolderLinksSettings[subKey];
              } else {
                subResult[subKey] = DEFAULT_FOLDER_LINKS_SETTINGS[subKey];
              }
            }
            resultArray.push(subResult as FolderLinksSettings);
          }
          result[key] = resultArray;
        } else {
          result[key] = DEFAULT_SETTINGS[key];
        }
      } else {
        result[key] = loadedData[key];
      }
    } else {
      result[key] = DEFAULT_SETTINGS[key];
    }
  }

  plugin.settings = result as NavLinkHeaderSettings;
  plugin.settingsUnderChange = deepCopy(plugin.settings);
  await plugin.saveData(plugin.settings);
}

export class NavLinkHeaderSettingTab extends PluginSettingTab {
  constructor(private plugin: NavLinkHeader) {
    super(plugin.app, plugin);
  }

  public display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Display navigation links in each view")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange!.displayInMarkdownViews)
          .onChange((value) => {
            this.plugin.settingsUnderChange!.displayInMarkdownViews = value;
            this.plugin.triggerSettingsChangedEvent();
          });
      });

    new Setting(containerEl)
      .setName("Display navigation links in page preview")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange!.displayInHoverPopovers)
          .onChange((value) => {
            this.plugin.settingsUnderChange!.displayInHoverPopovers = value;
            this.plugin.triggerSettingsChangedEvent();
          });
      });

    new Setting(containerEl)
      .setName("Display order of links")
      .setDesc(
        "Specify the order in which the links are displayed. " +
          'For example, if you specify "[[p]],[[P]],[[f]],🏠,⬆️,📌,🔗" ' +
          "(without double quotes), links will be displayed in that order " +
          "(see also the descriptions in Annotation strings and " +
          "Property mappings below). " +
          '"[[p]]", "[[P]]", and "[[f]]" are special strings that correspond to ' +
          "periodic notes, previous/next/parent notes specified by properties, " +
          "and notes in a folder, respectively " +
          "(see also the descriptions below)."
      )
      .addText((text) => {
        const order = this.plugin.settingsUnderChange!.displayOrderOfLinks.join(",");
        text.setValue(order).onChange((value) => {
          this.plugin.settingsUnderChange!.displayOrderOfLinks = parsePrefixStrings(value);
          this.plugin.triggerSettingsChangedEvent();
        });
      });

    new Setting(containerEl)
      .setName("Property name to specify display text")
      .setDesc(
        "If you want to use file properties to specify the note's display text, " +
          "set the property name to this field. Leave this field blank " +
          "if you are not using this feature."
      )
      .addText((text) => {
        text
          .setValue(this.plugin.settingsUnderChange!.propertyNameForDisplayText)
          .setPlaceholder("title")
          .onChange((value) => {
            this.plugin.settingsUnderChange!.propertyNameForDisplayText = value;
            this.plugin.triggerSettingsChangedEvent();
          });
      });

    new Setting(containerEl)
      .setName("Filter duplicate links")
      .setDesc("Filter out duplicates when multiple links with the same destination are detected.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange!.filterDuplicateNotes).onChange((value) => {
          this.plugin.settingsUnderChange!.filterDuplicateNotes = value;
          this.plugin.triggerSettingsChangedEvent();
        });
      });

    new Setting(containerEl)
      .setName("Duplicate link filtering priority")
      .setDesc(
        "Specify the filtering priority. " +
          'For example, if you specify "🏠,⬆️,📌,🔗" (without double quotes), ' +
          'the link with "🏠" will be displayed with the highest priority.'
      )
      .addText((text) => {
        const priority = this.plugin.settingsUnderChange!.duplicateNoteFilteringPriority.join(",");
        text.setValue(priority).onChange((value) => {
          this.plugin.settingsUnderChange!.duplicateNoteFilteringPriority =
            parsePrefixStrings(value);
          this.plugin.triggerSettingsChangedEvent();
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
        toggle.setValue(this.plugin.settingsUnderChange!.displayPlaceholder).onChange((value) => {
          this.plugin.settingsUnderChange!.displayPlaceholder = value;
          this.plugin.triggerSettingsChangedEvent();
        });
      });

    new Setting(containerEl)
      .setName("Confirm when creating a new file")
      .setDesc(
        "Display a confirmation dialog when a new file is created. " +
          "This option is currently only used for periodic notes."
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange!.confirmFileCreation).onChange((value) => {
          this.plugin.settingsUnderChange!.confirmFileCreation = value;
          this.plugin.triggerSettingsChangedEvent();
        });
      });

    new Setting(containerEl).setName("Annotated links").setHeading();

    new Setting(containerEl)
      .setName("Annotation strings")
      .setDesc(
        "Define the annotation strings. " +
          "If one of the annotation strings (typically emojis) is placed " +
          "immediately before a link in a note content, the link is " +
          "recognized as an annotated link. " +
          "Notes with annotated links appear as backlinks at the top of the " +
          "destination note. " +
          "Any string, including emoji, is acceptable as long as " +
          "the following link is recognized as a backlink. " +
          "To specify multiple annotations, separate them with commas. " +
          'e.g. "📌,🔗" (without double quotes). Leave this field blank ' +
          "if you are not using this feature."
      )
      .addText((text) => {
        const annotations = this.plugin.settingsUnderChange!.annotationStrings.join(",");
        text.setValue(annotations).onChange((value) => {
          this.plugin.settingsUnderChange!.annotationStrings = parsePrefixStrings(value);
          this.plugin.triggerSettingsChangedEvent();
        });
      });

    new Setting(containerEl)
      .setName("Allow a space between the annotation string and the link")
      .setDesc(
        "Even if there is a space between the annotation string and the link, " +
          "the link is still recognized as an annotated link."
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange!.allowSpaceAfterAnnotationString)
          .onChange((value) => {
            this.plugin.settingsUnderChange!.allowSpaceAfterAnnotationString = value;
            this.plugin.triggerSettingsChangedEvent();
          });
      });

    new Setting(containerEl)
      .setName("Ignore variation selectors")
      .setDesc(
        "If enabled, variation selectors of unicode characters will be ignored " +
          "when searching for links."
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange!.ignoreVariationSelectors)
          .onChange((value) => {
            this.plugin.settingsUnderChange!.ignoreVariationSelectors = value;
            this.plugin.triggerSettingsChangedEvent();
          });
      });

    new Setting(containerEl).setName("Links specified by file properties").setHeading();

    new Setting(containerEl)
      .setName("Property mappings")
      .setDesc(
        "Define the property mappings. " +
          "If the file property specified here points to a specific note, " +
          "that note will be displayed in navigation " +
          "(URLs to the website are also supported). " +
          "Each mapping consists of a property name and a string " +
          "that will be placed at the beginning of the link when " +
          "it appears in the navigation (use emojis in this string if " +
          "you want it to appear like an icon). " +
          'Each line should be in the format "property name:preceding string" ' +
          "(without double quotes). Leave this field blank " +
          "if you are not using this feature."
      )
      .addTextArea((text) => {
        const mappings = this.plugin
          .settingsUnderChange!.propertyMappings.map(
            (mapping) => `${mapping.property}:${mapping.prefix}`
          )
          .join("\n");
        text
          .setValue(mappings)
          .setPlaceholder("up:⬆️\nhome:🏠")
          .onChange((value) => {
            this.plugin.settingsUnderChange!.propertyMappings = parsePropertyMappings(value);
            this.plugin.triggerSettingsChangedEvent();
          });
      });

    new Setting(containerEl).setName("Periodic note links").setHeading();

    new Setting(containerEl)
      .setName("Display previous and next links in daily notes")
      .setDesc(
        "To use this option, daily notes must be enabled " +
          "in Daily Notes plugin or Periodic Notes plugin."
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange!.prevNextLinksEnabledInDailyNotes)
          .onChange((value) => {
            this.plugin.settingsUnderChange!.prevNextLinksEnabledInDailyNotes = value;
            this.plugin.triggerSettingsChangedEvent();
          });
      });

    new Setting(containerEl).setName("Parent for daily notes").addDropdown((dropdown) => {
      dropdown
        .addOptions({
          none: "None",
          week: "Weekly",
          month: "Monthly",
          quarter: "Quarterly",
          year: "Yearly",
        })
        .setValue(this.plugin.settingsUnderChange!.parentLinkGranularityInDailyNotes ?? "none")
        .onChange((value) => {
          this.plugin.settingsUnderChange!.parentLinkGranularityInDailyNotes =
            value !== "none" ? (value as IGranularity) : undefined;
          this.plugin.triggerSettingsChangedEvent();
        });
    });

    new Setting(containerEl)
      .setName("Display previous and next links in weekly notes")
      .setDesc("To use this option, weekly notes must be enabled in Periodic Notes plugin.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange!.prevNextLinksEnabledInWeeklyNotes)
          .onChange((value) => {
            this.plugin.settingsUnderChange!.prevNextLinksEnabledInWeeklyNotes = value;
            this.plugin.triggerSettingsChangedEvent();
          });
      });

    new Setting(containerEl).setName("Parent for weekly notes").addDropdown((dropdown) => {
      dropdown
        .addOptions({
          none: "None",
          month: "Monthly",
          quarter: "Quarterly",
          year: "Yearly",
        })
        .setValue(this.plugin.settingsUnderChange!.parentLinkGranularityInWeeklyNotes ?? "none")
        .onChange((value) => {
          this.plugin.settingsUnderChange!.parentLinkGranularityInWeeklyNotes =
            value !== "none" ? (value as IGranularity) : undefined;
          this.plugin.triggerSettingsChangedEvent();
        });
    });

    new Setting(containerEl)
      .setName("Display previous and next links in monthly notes")
      .setDesc("To use this option, monthly notes must be enabled in Periodic Notes plugin.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange!.prevNextLinksEnabledInMonthlyNotes)
          .onChange((value) => {
            this.plugin.settingsUnderChange!.prevNextLinksEnabledInMonthlyNotes = value;
            this.plugin.triggerSettingsChangedEvent();
          });
      });

    new Setting(containerEl).setName("Parent for monthly notes").addDropdown((dropdown) => {
      dropdown
        .addOptions({
          none: "None",
          quarter: "Quarterly",
          year: "Yearly",
        })
        .setValue(this.plugin.settingsUnderChange!.parentLinkGranularityInMonthlyNotes ?? "none")
        .onChange((value) => {
          this.plugin.settingsUnderChange!.parentLinkGranularityInMonthlyNotes =
            value !== "none" ? (value as IGranularity) : undefined;
          this.plugin.triggerSettingsChangedEvent();
        });
    });

    new Setting(containerEl)
      .setName("Display previous and next links in quarterly notes")
      .setDesc("To use this option, quarterly notes must be enabled in Periodic Notes plugin.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange!.prevNextLinksEnabledInQuarterlyNotes)
          .onChange((value) => {
            this.plugin.settingsUnderChange!.prevNextLinksEnabledInQuarterlyNotes = value;
            this.plugin.triggerSettingsChangedEvent();
          });
      });

    new Setting(containerEl).setName("Parent for quarterly notes").addDropdown((dropdown) => {
      dropdown
        .addOptions({
          none: "None",
          year: "Yearly",
        })
        .setValue(this.plugin.settingsUnderChange!.parentLinkGranularityInQuarterlyNotes ?? "none")
        .onChange((value) => {
          this.plugin.settingsUnderChange!.parentLinkGranularityInQuarterlyNotes =
            value !== "none" ? (value as IGranularity) : undefined;
          this.plugin.triggerSettingsChangedEvent();
        });
    });

    new Setting(containerEl)
      .setName("Display previous and next links in yearly notes")
      .setDesc("To use this option, yearly notes must be enabled in Periodic Notes plugin.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange!.prevNextLinksEnabledInYearlyNotes)
          .onChange((value) => {
            this.plugin.settingsUnderChange!.prevNextLinksEnabledInYearlyNotes = value;
            this.plugin.triggerSettingsChangedEvent();
          });
      });

    new Setting(containerEl)
      .setName("Previous, next, and parent links specified by file properties")
      .setHeading();

    new Setting(containerEl)
      .setName("Property name for the previous note")
      .setDesc(
        "If the file property specified here points to a specific note, " +
          "that note will be displayed in navigation as a previous note."
      )
      .addText((text) => {
        text
          .setValue(this.plugin.settingsUnderChange!.previousLinkProperty)
          .setPlaceholder("previous")
          .onChange((value) => {
            this.plugin.settingsUnderChange!.previousLinkProperty = value;
            this.plugin.triggerSettingsChangedEvent();
          });
      });

    new Setting(containerEl)
      .setName("Property name for the next note")
      .setDesc(
        "If the file property specified here points to a specific note, " +
          "that note will be displayed in navigation as a next note."
      )
      .addText((text) => {
        text
          .setValue(this.plugin.settingsUnderChange!.nextLinkProperty)
          .setPlaceholder("next")
          .onChange((value) => {
            this.plugin.settingsUnderChange!.nextLinkProperty = value;
            this.plugin.triggerSettingsChangedEvent();
          });
      });

    new Setting(containerEl)
      .setName("Property name for the parent note")
      .setDesc(
        "If the file property specified here points to a specific note, " +
          "that note will be displayed in navigation as a parent note."
      )
      .addText((text) => {
        text
          .setValue(this.plugin.settingsUnderChange!.parentLinkProperty)
          .setPlaceholder("parent")
          .onChange((value) => {
            this.plugin.settingsUnderChange!.parentLinkProperty = value;
            this.plugin.triggerSettingsChangedEvent();
          });
      });

    new Setting(containerEl)
      .setName("Previous, next, and parent links for ordered notes in specified folders")
      .setHeading();

    const folderLinksSettingsArray = this.plugin.settingsUnderChange!.folderLinksSettingsArray;
    for (let i = 0; i < folderLinksSettingsArray.length; i++) {
      const folderLinkSettings = folderLinksSettingsArray[i];

      // The actual index will be the number shown here - 1.
      new Setting(containerEl).setName(`Folder #${i + 1}`).setHeading();

      new Setting(containerEl)
        .setName("Folder path")
        .setDesc(
          "The notes in this folder are recognized as ordered notes " +
            "and can be navigated back and forth."
        )
        .addText((text) => {
          text
            .setValue(folderLinkSettings.folderPath)
            .setPlaceholder("path/to/the/folder")
            .onChange((value) => {
              const trimmed = value.trim();
              folderLinkSettings.folderPath = trimmed === "" ? "" : normalizePath(trimmed);
              this.plugin.triggerSettingsChangedEvent();
            });
        });

      new Setting(containerEl)
        .setName("Recursive")
        .setDesc("Whether to include notes in subfolders.")
        .addToggle((toggle) => {
          toggle.setValue(folderLinkSettings.recursive).onChange((value) => {
            folderLinkSettings.recursive = value;
            this.plugin.triggerSettingsChangedEvent();
          });
        });

      new Setting(containerEl)
        .setName("Regular expression")
        .setDesc(
          "The regular expression to filter notes in the folder. " +
            "If you want to include all files, leave this field blank."
        )
        .addText((text) => {
          text
            .setValue(folderLinkSettings.filterRegex)
            .setPlaceholder("^\\d{3}_.+\\.md$")
            .onChange((value) => {
              folderLinkSettings.filterRegex = value;
              this.plugin.triggerSettingsChangedEvent();
            });
        });

      new Setting(containerEl).setName("Filter by").addDropdown((dropdown) => {
        dropdown
          .addOptions({
            filename: "File name",
            property: "Property",
          })
          .setValue(folderLinkSettings.filterBy)
          .onChange((value) => {
            folderLinkSettings.filterBy = value as "filename" | "property";
            this.plugin.triggerSettingsChangedEvent();
          });
      });

      new Setting(containerEl)
        .setName("Property name to filter by")
        .setDesc(
          "The name of the property to filter by. " +
            'This is required when "Filter by" is set to "Property".'
        )
        .addText((text) => {
          text.setValue(folderLinkSettings.filterPropertyName).onChange((value) => {
            folderLinkSettings.filterPropertyName = value;
            this.plugin.triggerSettingsChangedEvent();
          });
        });

      new Setting(containerEl).setName("Sort order").addDropdown((dropdown) => {
        dropdown
          .addOptions({
            asc: "Ascending",
            desc: "Descending",
          })
          .setValue(folderLinkSettings.sortOrder)
          .onChange((value) => {
            folderLinkSettings.sortOrder = value as "asc" | "desc";
            this.plugin.triggerSettingsChangedEvent();
          });
      });

      new Setting(containerEl).setName("Sort by").addDropdown((dropdown) => {
        dropdown
          .addOptions({
            filename: "File name",
            created: "Creation date",
            modified: "Modification date",
            property: "Property",
          })
          .setValue(folderLinkSettings.sortBy)
          .onChange((value) => {
            folderLinkSettings.sortBy = value as "filename" | "created" | "modified" | "property";
            this.plugin.triggerSettingsChangedEvent();
          });
      });

      new Setting(containerEl)
        .setName("Property name to sort by")
        .setDesc(
          "The name of the property to sort by. " +
            'This is required when "Sort by" is set to "Property".'
        )
        .addText((text) => {
          text.setValue(folderLinkSettings.sortPropertyName).onChange((value) => {
            folderLinkSettings.sortPropertyName = value;
            this.plugin.triggerSettingsChangedEvent();
          });
        });

      new Setting(containerEl).setName("Path to the parent note").addText((text) => {
        text
          .setValue(folderLinkSettings.parentPath)
          .setPlaceholder("path/to/the/note.md")
          .onChange((value) => {
            const trimmed = value.trim();
            folderLinkSettings.parentPath = trimmed === "" ? "" : normalizePath(trimmed);
            this.plugin.triggerSettingsChangedEvent();
          });
      });

      new Setting(containerEl)
        .setName("")
        .addButton((button) => {
          button.setButtonText("Move up").onClick(() => {
            this.swapFolderLinksSettings(i, i - 1);
            this.plugin.triggerSettingsChangedEvent();
            this.display(); // Force re-render.
          });
        })
        .addButton((button) => {
          button.setButtonText("Move down").onClick(() => {
            this.swapFolderLinksSettings(i, i + 1);
            this.plugin.triggerSettingsChangedEvent();
            this.display(); // Force re-render.
          });
        })
        .addButton((button) => {
          button
            .setButtonText(`Remove settings for folder #${i + 1}`)
            .setWarning()
            .onClick(() => {
              folderLinksSettingsArray.splice(i, 1);
              this.plugin.triggerSettingsChangedEvent();
              this.display(); // Force re-render.
            });
        });
    }

    new Setting(containerEl).setName("").addButton((button) => {
      button
        .setButtonText("Add a new folder")
        .setCta()
        .onClick(() => {
          this.plugin.settingsUnderChange!.folderLinksSettingsArray.push(
            deepCopy(DEFAULT_FOLDER_LINKS_SETTINGS)
          );
          this.plugin.triggerSettingsChangedEvent();
          this.display(); // Force re-render.
        });
    });
  }

  /**
   * Swaps the elements at the specified indices in the array.
   * If the indices are out of range, nothing happens.
   * @param index1 The index of the first element.
   * @param index2 The index of the second element.
   */
  private swapFolderLinksSettings(index1: number, index2: number): void {
    const folderLinksSettingsArray = this.plugin.settingsUnderChange!.folderLinksSettingsArray;
    if (index1 < 0 || index1 >= folderLinksSettingsArray.length) {
      return;
    }
    if (index2 < 0 || index2 >= folderLinksSettingsArray.length) {
      return;
    }
    const temp = folderLinksSettingsArray[index1];
    folderLinksSettingsArray[index1] = folderLinksSettingsArray[index2];
    folderLinksSettingsArray[index2] = temp;
  }
}

/**
 * Parses the comma-separated strings and returns an array of strings.
 */
function parsePrefixStrings(prefixes: string): Array<string> {
  return prefixes
    .split(",")
    .map((prefix) => prefix.trim())
    .filter((prefix) => prefix.length > 0);
}

/**
 * Parses the string with multiple lines of "key:value",
 * and returns an array of property mappings.
 */
function parsePropertyMappings(mappings: string): Array<{ property: string; prefix: string }> {
  return mappings
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((mapping) => {
      const [property, prefix] = mapping.split(":");
      return {
        property: property.trim(),
        prefix: prefix?.trim() ?? "",
      };
    })
    .filter((mapping) => mapping.property.length > 0 && mapping.prefix.length > 0);
}
