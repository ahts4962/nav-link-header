import { normalizePath, PluginSettingTab, Setting } from "obsidian";
import type { IGranularity } from "obsidian-daily-notes-interface";
import type NavLinkHeader from "./main";
import {
  DISPLAY_ORDER_PLACEHOLDER_FOLDER,
  DISPLAY_ORDER_PLACEHOLDER_PERIODIC,
  DISPLAY_ORDER_PLACEHOLDER_PROPERTY,
} from "./linkContainer";
import { EMOJI_ANNOTATION_PLACEHOLDER } from "./annotatedLink";
import { deepCopy } from "./utils";

export interface NavLinkHeaderSettings {
  matchNavigationWidthToLineLength: boolean;
  displayOrderOfLinks: string[];
  propertyNameForDisplayText: string;
  filterDuplicateNotes: boolean;
  duplicateNoteFilteringPriority: string[];
  displayLoadingMessage: boolean;
  displayPlaceholder: boolean;
  confirmFileCreation: boolean;
  trimStringsInSettings: boolean;
  displayInLeaves: boolean;
  displayInHoverPopovers: boolean;
  displayInMarkdownViews: boolean;
  displayInImageViews: boolean;
  displayInVideoViews: boolean;
  displayInAudioViews: boolean;
  displayInPdfViews: boolean;
  displayInCanvasViews: boolean;
  displayInBasesViews: boolean;
  displayInOtherViews: boolean;
  annotationStrings: string[];
  hideAnnotatedLinkPrefix: boolean;
  advancedAnnotationStrings: { regex: string; prefix: string }[];
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

export const DEFAULT_SETTINGS: NavLinkHeaderSettings = {
  matchNavigationWidthToLineLength: false,
  displayOrderOfLinks: [],
  propertyNameForDisplayText: "",
  filterDuplicateNotes: true,
  duplicateNoteFilteringPriority: [],
  displayLoadingMessage: true,
  displayPlaceholder: false,
  confirmFileCreation: true,
  trimStringsInSettings: true,
  displayInLeaves: true,
  displayInHoverPopovers: true,
  displayInMarkdownViews: true,
  displayInImageViews: true,
  displayInVideoViews: true,
  displayInAudioViews: true,
  displayInPdfViews: true,
  displayInCanvasViews: true,
  displayInBasesViews: true,
  displayInOtherViews: false,
  annotationStrings: [],
  hideAnnotatedLinkPrefix: false,
  advancedAnnotationStrings: [],
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

/**
 * Loads and migrates the plugin settings for NavLinkHeader.
 * This function retrieves the saved settings data using the provided plugin instance,
 * applies necessary migrations from older settings formats, and ensures all settings
 * keys are populated with either loaded or default values.
 * @param plugin The `NavLinkHeader` plugin instance used to load persisted data.
 * @returns A promise that resolves to the fully populated and
 *     migrated `NavLinkHeaderSettings` object.
 */
export async function loadSettings(plugin: NavLinkHeader): Promise<NavLinkHeaderSettings> {
  const result = {} as Record<keyof NavLinkHeaderSettings, unknown>;
  const loadedData = ((await plugin.loadData()) ?? {}) as Record<string, unknown>;

  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof NavLinkHeaderSettings)[]) {
    // Migration from old settings.

    // Introduced in 2.2.0
    if (
      key === "displayInLeaves" &&
      !("displayInLeaves" in loadedData) &&
      "displayInMarkdownViews" in loadedData
    ) {
      result[key] = loadedData["displayInMarkdownViews"];
      continue;
    }

    // Introduced in 2.0.0
    if (
      key === "displayOrderOfLinks" &&
      "annotatedLinksEnabled" in loadedData &&
      loadedData["annotatedLinksEnabled"] &&
      "annotationStrings" in loadedData &&
      typeof loadedData["annotationStrings"] === "string"
    ) {
      result[key] = parsePrefixStrings(loadedData["annotationStrings"], true, false);
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
      result[key] = parsePrefixStrings(loadedData[key], true, false);
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

  return result as NavLinkHeaderSettings;
}

/**
 * Represents the settings tab for the Nav Link Header plugin in Obsidian.
 */
export class NavLinkHeaderSettingTab extends PluginSettingTab {
  constructor(private plugin: NavLinkHeader) {
    super(plugin.app, plugin);
  }

  public display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Match navigation width to line length")
      .setDesc(
        "If enabled, the width of the navigation will match the line length of the note. " +
          'Here, "line length" refers to the width defined when ' +
          'Obsidian\'s "Readable line length" option is enabled.'
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange.matchNavigationWidthToLineLength)
          .onChange((value) => {
            this.plugin.settingsUnderChange.matchNavigationWidthToLineLength = value;
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl)
      .setName("Display order of links")
      .setDesc(
        "Specify the order in which the links are displayed. For example, if you specify " +
          `"${DISPLAY_ORDER_PLACEHOLDER_PERIODIC},${DISPLAY_ORDER_PLACEHOLDER_PROPERTY},` +
          `${DISPLAY_ORDER_PLACEHOLDER_FOLDER},🏠,⬆️,📌,🔗" ` +
          "(without double quotes), links will be displayed in that order " +
          "(see also the descriptions in Annotation strings and Property mappings below). " +
          `"${DISPLAY_ORDER_PLACEHOLDER_PERIODIC}", "${DISPLAY_ORDER_PLACEHOLDER_PROPERTY}", ` +
          `and "${DISPLAY_ORDER_PLACEHOLDER_FOLDER}" are special strings that correspond to ` +
          "periodic notes, previous/next/parent notes specified by properties, " +
          "and notes in a folder, respectively (see also the descriptions below)."
      )
      .addText((text) => {
        const order = this.plugin.settingsUnderChange.displayOrderOfLinks.join(",");
        text.setValue(order).onChange((value) => {
          this.plugin.settingsUnderChange.displayOrderOfLinks = parsePrefixStrings(
            value,
            this.plugin.settings.trimStringsInSettings,
            true
          );
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Property name to specify display text")
      .setDesc(
        "If you want to use file properties to specify the note's display text, set the property " +
          "name to this field. Leave this field blank if you are not using this feature."
      )
      .addText((text) => {
        text
          .setValue(this.plugin.settingsUnderChange.propertyNameForDisplayText)
          .setPlaceholder("title")
          .onChange((value) => {
            this.plugin.settingsUnderChange.propertyNameForDisplayText = value;
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl)
      .setName("Filter duplicate links")
      .setDesc("Filter out duplicates when multiple links with the same destination are detected.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.filterDuplicateNotes).onChange((value) => {
          this.plugin.settingsUnderChange.filterDuplicateNotes = value;
          this.plugin.triggerSettingsChangedDebounced();
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
        const priority = this.plugin.settingsUnderChange.duplicateNoteFilteringPriority.join(",");
        text.setValue(priority).onChange((value) => {
          this.plugin.settingsUnderChange.duplicateNoteFilteringPriority = parsePrefixStrings(
            value,
            this.plugin.settings.trimStringsInSettings,
            true
          );
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display loading message")
      .setDesc(
        'Display a loading message ("Loading...") in the navigation while links are being loaded.'
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayLoadingMessage).onChange((value) => {
          this.plugin.settingsUnderChange.displayLoadingMessage = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display placeholder")
      .setDesc('Display a placeholder ("No links") when there is nothing to display.')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayPlaceholder).onChange((value) => {
          this.plugin.settingsUnderChange.displayPlaceholder = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Confirm when creating a new file")
      .setDesc(
        "Display a confirmation dialog when a new file is created. " +
          "This option is currently only used for periodic notes."
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.confirmFileCreation).onChange((value) => {
          this.plugin.settingsUnderChange.confirmFileCreation = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Trim whitespace in input fields")
      .setDesc(
        "When enabled, leading and trailing whitespace will be trimmed from the strings " +
          'entered in "Display order of links", "Duplicate link filtering priority", ' +
          '"Annotation strings", and "Property mappings". ' +
          "Disable this option if you want to include spaces intentionally."
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.trimStringsInSettings).onChange((value) => {
          this.plugin.settingsUnderChange.trimStringsInSettings = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl).setName("Display targets").setHeading();

    new Setting(containerEl)
      .setName("Display navigation links in panes")
      .setDesc(
        "This setting applies to note containers (panes). To show links, also enable " +
          "view-specific options below."
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInLeaves).onChange((value) => {
          this.plugin.settingsUnderChange.displayInLeaves = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display navigation links in page previews")
      .setDesc(
        "This setting applies to note containers (page previews). To show links, also enable " +
          "view-specific options below."
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange.displayInHoverPopovers)
          .onChange((value) => {
            this.plugin.settingsUnderChange.displayInHoverPopovers = value;
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl)
      .setName("Display navigation links in Markdown views")
      .setDesc("Show navigation links when viewing Markdown documents.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange.displayInMarkdownViews)
          .onChange((value) => {
            this.plugin.settingsUnderChange.displayInMarkdownViews = value;
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl)
      .setName("Display navigation links in Image views")
      .setDesc("Show navigation links when viewing images.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInImageViews).onChange((value) => {
          this.plugin.settingsUnderChange.displayInImageViews = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display navigation links in Video views")
      .setDesc("Show navigation links when viewing videos.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInVideoViews).onChange((value) => {
          this.plugin.settingsUnderChange.displayInVideoViews = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display navigation links in Audio views")
      .setDesc("Show navigation links when viewing audio.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInAudioViews).onChange((value) => {
          this.plugin.settingsUnderChange.displayInAudioViews = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display navigation links in PDF views")
      .setDesc("Show navigation links when viewing PDFs.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInPdfViews).onChange((value) => {
          this.plugin.settingsUnderChange.displayInPdfViews = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display navigation links in Canvas views")
      .setDesc("Show navigation links when viewing Canvas.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInCanvasViews).onChange((value) => {
          this.plugin.settingsUnderChange.displayInCanvasViews = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display navigation links in Bases views")
      .setDesc("Show navigation links when viewing Bases.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInBasesViews).onChange((value) => {
          this.plugin.settingsUnderChange.displayInBasesViews = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display navigation links in other views")
      .setDesc(
        "Show navigation links in other views (such as views introduced by community plugins). " +
          "This may not work depending on the view type."
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInOtherViews).onChange((value) => {
          this.plugin.settingsUnderChange.displayInOtherViews = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl).setName("Annotated links").setHeading();

    new Setting(containerEl)
      .setName("Annotation strings")
      .setDesc(
        "Define the annotation strings. " +
          "If one of the annotation strings (typically emojis) is placed immediately before " +
          "a link in a note content, the link is recognized as an annotated link. " +
          "Notes with annotated links appear as backlinks at the top of the destination note. " +
          "Any string, including emoji, is acceptable as long as the following link is " +
          "recognized as a backlink. To specify multiple annotations, separate them with commas. " +
          'e.g. "📌,🔗" (without double quotes). ' +
          `"${EMOJI_ANNOTATION_PLACEHOLDER}" can be used as a special placeholder ` +
          "that represents any single emoji. For example, if you specify only " +
          `"${EMOJI_ANNOTATION_PLACEHOLDER}", all links preceded by an emoji will be matched. ` +
          `You can also mix it with other entries, e.g. "${EMOJI_ANNOTATION_PLACEHOLDER}📌,🔗". ` +
          "Leave this field blank if you are not using this feature."
      )
      .addText((text) => {
        const annotations = this.plugin.settingsUnderChange.annotationStrings.join(",");
        text.setValue(annotations).onChange((value) => {
          this.plugin.settingsUnderChange.annotationStrings = parsePrefixStrings(
            value,
            this.plugin.settings.trimStringsInSettings,
            false
          );
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Hide annotation strings in navigation")
      .setDesc(
        "If enabled, annotation strings (e.g. emojis) will be hidden in the navigation links."
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange.hideAnnotatedLinkPrefix)
          .onChange((value) => {
            this.plugin.settingsUnderChange.hideAnnotatedLinkPrefix = value;
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl)
      .setName("Advanced annotation strings")
      .setDesc(
        "An advanced version of Annotation strings. Here you can use regular expressions as " +
          "the annotation string and specify any prefix (e.g., an emoji) to display " +
          'in the navigation header. Enter one mapping per line in the format "regex:prefix". ' +
          'To include a colon in the prefix, escape it as "\\:". ' +
          "An empty string is also acceptable as a prefix. "
      )
      .addTextArea((text) => {
        const annotations = this.plugin.settingsUnderChange.advancedAnnotationStrings
          .map((annotation) => `${annotation.regex}:${annotation.prefix.replace(/:/g, "\\:")}`)
          .join("\n");
        text
          .setValue(annotations)
          .setPlaceholder("📌:🔗\n(?:^|\\n)-:\n\\[\\[E\\]\\]:🔗")
          .onChange((value) => {
            this.plugin.settingsUnderChange.advancedAnnotationStrings =
              parseAdvancedAnnotationStrings(value, this.plugin.settings.trimStringsInSettings);
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl)
      .setName("Allow a space between the annotation string and the link")
      .setDesc(
        "If enabled, a link will still be recognized as an annotated link even if there is a " +
          "space between the annotation string and the link."
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange.allowSpaceAfterAnnotationString)
          .onChange((value) => {
            this.plugin.settingsUnderChange.allowSpaceAfterAnnotationString = value;
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl)
      .setName("Ignore variation selectors")
      .setDesc("If enabled, emoji variation selectors (VS15/VS16) are ignored when matching links.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange.ignoreVariationSelectors)
          .onChange((value) => {
            this.plugin.settingsUnderChange.ignoreVariationSelectors = value;
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl).setName("Links specified by file properties").setHeading();

    new Setting(containerEl)
      .setName("Property mappings")
      .setDesc(
        "Define the property mappings. If the file property specified here points to a " +
          "specific note, that note will be displayed in navigation (URLs to the website are " +
          "also supported). Each mapping consists of a property name and a string that will " +
          "be placed at the beginning of the link when it appears in the navigation (use " +
          "emojis in this string if you want it to appear like an icon). Each line should be " +
          'in the format "property name:prefix" (without double quotes). ' +
          'To include a colon in the prefix, escape it as "\\:". ' +
          "An empty string is also acceptable as a prefix. " +
          "Leave this field blank if you are not using this feature."
      )
      .addTextArea((text) => {
        const mappings = this.plugin.settingsUnderChange.propertyMappings
          .map((mapping) => `${mapping.property}:${mapping.prefix.replace(/:/g, "\\:")}`)
          .join("\n");
        text
          .setValue(mappings)
          .setPlaceholder("up:⬆️\nhome:🏠")
          .onChange((value) => {
            this.plugin.settingsUnderChange.propertyMappings = parsePropertyMappings(
              value,
              this.plugin.settings.trimStringsInSettings
            );
            this.plugin.triggerSettingsChangedDebounced();
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
          .setValue(this.plugin.settingsUnderChange.prevNextLinksEnabledInDailyNotes)
          .onChange((value) => {
            this.plugin.settingsUnderChange.prevNextLinksEnabledInDailyNotes = value;
            this.plugin.triggerSettingsChangedDebounced();
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
        .setValue(this.plugin.settingsUnderChange.parentLinkGranularityInDailyNotes ?? "none")
        .onChange((value) => {
          this.plugin.settingsUnderChange.parentLinkGranularityInDailyNotes =
            value !== "none" ? (value as IGranularity) : undefined;
          this.plugin.triggerSettingsChangedDebounced();
        });
    });

    new Setting(containerEl)
      .setName("Display previous and next links in weekly notes")
      .setDesc("To use this option, weekly notes must be enabled in Periodic Notes plugin.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange.prevNextLinksEnabledInWeeklyNotes)
          .onChange((value) => {
            this.plugin.settingsUnderChange.prevNextLinksEnabledInWeeklyNotes = value;
            this.plugin.triggerSettingsChangedDebounced();
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
        .setValue(this.plugin.settingsUnderChange.parentLinkGranularityInWeeklyNotes ?? "none")
        .onChange((value) => {
          this.plugin.settingsUnderChange.parentLinkGranularityInWeeklyNotes =
            value !== "none" ? (value as IGranularity) : undefined;
          this.plugin.triggerSettingsChangedDebounced();
        });
    });

    new Setting(containerEl)
      .setName("Display previous and next links in monthly notes")
      .setDesc("To use this option, monthly notes must be enabled in Periodic Notes plugin.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange.prevNextLinksEnabledInMonthlyNotes)
          .onChange((value) => {
            this.plugin.settingsUnderChange.prevNextLinksEnabledInMonthlyNotes = value;
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl).setName("Parent for monthly notes").addDropdown((dropdown) => {
      dropdown
        .addOptions({
          none: "None",
          quarter: "Quarterly",
          year: "Yearly",
        })
        .setValue(this.plugin.settingsUnderChange.parentLinkGranularityInMonthlyNotes ?? "none")
        .onChange((value) => {
          this.plugin.settingsUnderChange.parentLinkGranularityInMonthlyNotes =
            value !== "none" ? (value as IGranularity) : undefined;
          this.plugin.triggerSettingsChangedDebounced();
        });
    });

    new Setting(containerEl)
      .setName("Display previous and next links in quarterly notes")
      .setDesc("To use this option, quarterly notes must be enabled in Periodic Notes plugin.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange.prevNextLinksEnabledInQuarterlyNotes)
          .onChange((value) => {
            this.plugin.settingsUnderChange.prevNextLinksEnabledInQuarterlyNotes = value;
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl).setName("Parent for quarterly notes").addDropdown((dropdown) => {
      dropdown
        .addOptions({
          none: "None",
          year: "Yearly",
        })
        .setValue(this.plugin.settingsUnderChange.parentLinkGranularityInQuarterlyNotes ?? "none")
        .onChange((value) => {
          this.plugin.settingsUnderChange.parentLinkGranularityInQuarterlyNotes =
            value !== "none" ? (value as IGranularity) : undefined;
          this.plugin.triggerSettingsChangedDebounced();
        });
    });

    new Setting(containerEl)
      .setName("Display previous and next links in yearly notes")
      .setDesc("To use this option, yearly notes must be enabled in Periodic Notes plugin.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange.prevNextLinksEnabledInYearlyNotes)
          .onChange((value) => {
            this.plugin.settingsUnderChange.prevNextLinksEnabledInYearlyNotes = value;
            this.plugin.triggerSettingsChangedDebounced();
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
          .setValue(this.plugin.settingsUnderChange.previousLinkProperty)
          .setPlaceholder("previous")
          .onChange((value) => {
            this.plugin.settingsUnderChange.previousLinkProperty = value;
            this.plugin.triggerSettingsChangedDebounced();
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
          .setValue(this.plugin.settingsUnderChange.nextLinkProperty)
          .setPlaceholder("next")
          .onChange((value) => {
            this.plugin.settingsUnderChange.nextLinkProperty = value;
            this.plugin.triggerSettingsChangedDebounced();
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
          .setValue(this.plugin.settingsUnderChange.parentLinkProperty)
          .setPlaceholder("parent")
          .onChange((value) => {
            this.plugin.settingsUnderChange.parentLinkProperty = value;
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl)
      .setName("Previous, next, and parent links for ordered notes in specified folders")
      .setHeading();

    const folderLinksSettingsArray = this.plugin.settingsUnderChange.folderLinksSettingsArray;
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
              this.plugin.triggerSettingsChangedDebounced();
            });
        });

      new Setting(containerEl)
        .setName("Recursive")
        .setDesc("Whether to include notes in subfolders.")
        .addToggle((toggle) => {
          toggle.setValue(folderLinkSettings.recursive).onChange((value) => {
            folderLinkSettings.recursive = value;
            this.plugin.triggerSettingsChangedDebounced();
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
              this.plugin.triggerSettingsChangedDebounced();
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
            this.plugin.triggerSettingsChangedDebounced();
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
            this.plugin.triggerSettingsChangedDebounced();
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
            this.plugin.triggerSettingsChangedDebounced();
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
            this.plugin.triggerSettingsChangedDebounced();
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
            this.plugin.triggerSettingsChangedDebounced();
          });
        });

      new Setting(containerEl).setName("Path to the parent note").addText((text) => {
        text
          .setValue(folderLinkSettings.parentPath)
          .setPlaceholder("path/to/the/note.md")
          .onChange((value) => {
            const trimmed = value.trim();
            folderLinkSettings.parentPath = trimmed === "" ? "" : normalizePath(trimmed);
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

      new Setting(containerEl)
        .setName("")
        .addButton((button) => {
          button.setButtonText("Move up").onClick(() => {
            this.swapFolderLinksSettings(i, i - 1);
            this.plugin.triggerSettingsChangedDebounced();
            this.display(); // Force re-render.
          });
        })
        .addButton((button) => {
          button.setButtonText("Move down").onClick(() => {
            this.swapFolderLinksSettings(i, i + 1);
            this.plugin.triggerSettingsChangedDebounced();
            this.display(); // Force re-render.
          });
        })
        .addButton((button) => {
          button
            .setButtonText(`Remove settings for folder #${i + 1}`)
            .setWarning()
            .onClick(() => {
              folderLinksSettingsArray.splice(i, 1);
              this.plugin.triggerSettingsChangedDebounced();
              this.display(); // Force re-render.
            });
        });
    }

    new Setting(containerEl).setName("").addButton((button) => {
      button
        .setButtonText("Add a new folder")
        .setCta()
        .onClick(() => {
          this.plugin.settingsUnderChange.folderLinksSettingsArray.push(
            deepCopy(DEFAULT_FOLDER_LINKS_SETTINGS)
          );
          this.plugin.triggerSettingsChangedDebounced();
          this.display(); // Force re-render.
        });
    });
  }

  /**
   * Swaps the elements at the specified indices in the `folderLinksSettingsArray`.
   * If the indices are out of range, nothing happens.
   * @param index1 The index of the first element.
   * @param index2 The index of the second element.
   */
  private swapFolderLinksSettings(index1: number, index2: number): void {
    const folderLinksSettingsArray = this.plugin.settingsUnderChange.folderLinksSettingsArray;
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
 * Parses a comma-separated string into an array of strings.
 * If `trim` is true, leading and trailing whitespace is removed from each entry.
 * If `allowEmpty` is false, empty strings are filtered out.
 */
function parsePrefixStrings(prefixes: string, trim: boolean, allowEmpty: boolean): Array<string> {
  if (prefixes === "") {
    return [];
  }
  const result = prefixes.split(",").map((prefix) => (trim ? prefix.trim() : prefix));
  return allowEmpty ? result : result.filter((prefix) => prefix.length > 0);
}

/**
 * Parses the string with multiple lines of "regex:prefix",
 * and returns an array of advanced annotation mappings.
 * If `trim` is true, leading and trailing whitespace is removed from prefixes.
 * `\c` can be used to escape colons in prefixes.
 * The regex and prefix are split at the last unescaped colon.
 */
function parseAdvancedAnnotationStrings(
  annotations: string,
  trim: boolean
): Array<{ regex: string; prefix: string }> {
  return annotations
    .split("\n")
    .map((line) => line.replace(/\\:/g, "__ESC_COLON__"))
    .filter((line) => line.includes(":"))
    .map((annotation) => {
      const i = annotation.lastIndexOf(":");
      const regex = annotation.slice(0, i).replace(/__ESC_COLON__/g, ":");
      const prefix = annotation.slice(i + 1).replace(/__ESC_COLON__/g, ":");
      return {
        regex,
        prefix: trim ? prefix.trim() : prefix,
      };
    })
    .filter((mapping) => mapping.regex.length > 0);
}

/**
 * Parses the string with multiple lines of "property:prefix",
 * and returns an array of property mappings.
 * If `trim` is true, leading and trailing whitespace is removed from prefixes.
 * `\c` can be used to escape colons in prefixes.
 * The property and prefix are split at the last unescaped colon.
 */
function parsePropertyMappings(
  mappings: string,
  trim: boolean
): Array<{ property: string; prefix: string }> {
  return mappings
    .split("\n")
    .map((line) => line.replace(/\\:/g, "__ESC_COLON__"))
    .filter((line) => line.includes(":"))
    .map((mapping) => {
      const i = mapping.lastIndexOf(":");
      const property = mapping.slice(0, i).replace(/__ESC_COLON__/g, ":");
      const prefix = mapping.slice(i + 1).replace(/__ESC_COLON__/g, ":");

      // Since Obsidian automatically trims property names, we always trim them here too.
      return {
        property: property.trim(),
        prefix: trim ? prefix.trim() : prefix,
      };
    })
    .filter((mapping) => mapping.property.length > 0);
}
