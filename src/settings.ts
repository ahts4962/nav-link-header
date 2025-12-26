import { normalizePath, PluginSettingTab, Setting } from "obsidian";
import type { IGranularity } from "obsidian-daily-notes-interface";
import { lt } from "semver";
import type NavLinkHeader from "./main";
import {
  DISPLAY_ORDER_PLACEHOLDER_FOLDER,
  DISPLAY_ORDER_PLACEHOLDER_PERIODIC,
  DISPLAY_ORDER_PLACEHOLDER_PROPERTY,
} from "./itemPropsContainer";
import { EMOJI_ANNOTATION_PLACEHOLDER } from "./annotatedLink";
import { deepCopy } from "./utils";

export interface NavLinkHeaderSettings {
  version: string;
  matchNavigationWidthToLineLength: boolean;
  displayOrderOfLinks: string[];
  propertyNameForDisplayText: string;
  filterDuplicateNotes: boolean;
  duplicateNoteFilteringPriority: string[];
  itemCollapsePrefixes: string[];
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
  annotationStringsForBacklinks: string[];
  annotationStringsForCurrentNote: string[];
  hideAnnotatedLinkPrefix: boolean;
  advancedAnnotationStringsForBacklinks: { regex: string; prefix: string }[];
  advancedAnnotationStringsForCurrentNote: { regex: string; prefix: string }[];
  allowSpaceAfterAnnotationString: boolean;
  ignoreVariationSelectors: boolean;
  propertyMappings: { property: string; prefix: string }[];
  previousLinkPropertyMappings: { property: string; prefix: string }[];
  nextLinkPropertyMappings: { property: string; prefix: string }[];
  parentLinkPropertyMappings: { property: string; prefix: string }[];
  implicitReciprocalPropertyPairs: { propertyA: string; propertyB: string }[];
  prevNextLinksEnabledInDailyNotes: boolean;
  parentLinkGranularityInDailyNotes: IGranularity | "none";
  prevNextLinksEnabledInWeeklyNotes: boolean;
  parentLinkGranularityInWeeklyNotes: IGranularity | "none";
  prevNextLinksEnabledInMonthlyNotes: boolean;
  parentLinkGranularityInMonthlyNotes: IGranularity | "none";
  prevNextLinksEnabledInQuarterlyNotes: boolean;
  parentLinkGranularityInQuarterlyNotes: IGranularity | "none";
  prevNextLinksEnabledInYearlyNotes: boolean;
  annotationStringsForPinning: string[];
  startMarkerForPinning: string;
  endMarkerForPinning: string;
  folderLinksSettingsArray: FolderLinksSettings[];
}

export interface FolderLinksSettings {
  folderPaths: string[];
  excludedFolderPaths: string[];
  recursive: boolean;
  includePatterns: string[];
  excludePatterns: string[];
  enableRegex: boolean;
  filterBy: "filename" | "property";
  filterPropertyName: string;
  sortOrder: "asc" | "desc";
  sortBy: "filename" | "created" | "modified" | "property";
  sortPropertyName: string;
  maxLinks: number;
  parentPath: string;
  displayStyle: "full" | "separator" | "none";
  linkPrefix: string;
}

export const DEFAULT_SETTINGS: NavLinkHeaderSettings = {
  version: "2.7.1",
  matchNavigationWidthToLineLength: false,
  displayOrderOfLinks: [],
  propertyNameForDisplayText: "",
  filterDuplicateNotes: true,
  duplicateNoteFilteringPriority: [],
  itemCollapsePrefixes: [],
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
  annotationStringsForBacklinks: [],
  annotationStringsForCurrentNote: [],
  hideAnnotatedLinkPrefix: false,
  advancedAnnotationStringsForBacklinks: [],
  advancedAnnotationStringsForCurrentNote: [],
  allowSpaceAfterAnnotationString: false,
  ignoreVariationSelectors: false,
  propertyMappings: [],
  previousLinkPropertyMappings: [],
  nextLinkPropertyMappings: [],
  parentLinkPropertyMappings: [],
  implicitReciprocalPropertyPairs: [],
  prevNextLinksEnabledInDailyNotes: false,
  parentLinkGranularityInDailyNotes: "none",
  prevNextLinksEnabledInWeeklyNotes: false,
  parentLinkGranularityInWeeklyNotes: "none",
  prevNextLinksEnabledInMonthlyNotes: false,
  parentLinkGranularityInMonthlyNotes: "none",
  prevNextLinksEnabledInQuarterlyNotes: false,
  parentLinkGranularityInQuarterlyNotes: "none",
  prevNextLinksEnabledInYearlyNotes: false,
  annotationStringsForPinning: [],
  startMarkerForPinning: "",
  endMarkerForPinning: "",
  folderLinksSettingsArray: [],
};

const DEFAULT_FOLDER_LINKS_SETTINGS: FolderLinksSettings = {
  folderPaths: [],
  excludedFolderPaths: [],
  recursive: false,
  includePatterns: [],
  excludePatterns: [],
  enableRegex: false,
  filterBy: "filename",
  filterPropertyName: "",
  sortOrder: "asc",
  sortBy: "filename",
  sortPropertyName: "",
  maxLinks: 1,
  parentPath: "",
  displayStyle: "full",
  linkPrefix: "",
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
  let loadedData = ((await plugin.loadData()) ?? deepCopy(DEFAULT_SETTINGS)) as Record<
    string,
    unknown
  >;
  loadedData = convertOldSettings(loadedData);

  // Apply default values if not found in loaded data.
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof NavLinkHeaderSettings)[]) {
    if (!(key in loadedData)) {
      result[key] = deepCopy(DEFAULT_SETTINGS[key]);
    } else {
      if (key === "folderLinksSettingsArray") {
        if (!Array.isArray(loadedData[key])) {
          result[key] = deepCopy(DEFAULT_SETTINGS[key]);
        } else {
          const resultArray: FolderLinksSettings[] = [];
          for (let i = 0; i < loadedData[key].length; i++) {
            const subResult = {} as Record<keyof FolderLinksSettings, unknown>;
            const loadedFolderLinksSettings = loadedData[key][i] as Record<string, unknown>;
            for (const subKey of Object.keys(
              DEFAULT_FOLDER_LINKS_SETTINGS
            ) as (keyof FolderLinksSettings)[]) {
              if (!(subKey in loadedFolderLinksSettings)) {
                subResult[subKey] = deepCopy(DEFAULT_FOLDER_LINKS_SETTINGS[subKey]);
              } else {
                subResult[subKey] = loadedFolderLinksSettings[subKey];
              }
            }
            resultArray.push(subResult as FolderLinksSettings);
          }
          result[key] = resultArray;
        }
      } else {
        result[key] = loadedData[key];
      }
    }
  }

  return result as NavLinkHeaderSettings;
}

/**
 * Converts old settings data to the latest format.
 * This function checks the version of the loaded settings data and applies
 * necessary transformations to migrate old settings to the latest format.
 * @param loadedData The loaded settings data to be converted.
 * @returns The converted settings data in the latest format.
 */
function convertOldSettings(loadedData: Record<string, unknown>): Record<string, unknown> {
  if (!("version" in loadedData) || typeof loadedData["version"] !== "string") {
    loadedData["version"] = "1.0.0";
  }
  const version = loadedData["version"] as string;

  if (lt(version, "2.0.0")) {
    if (
      "annotatedLinksEnabled" in loadedData &&
      typeof loadedData["annotatedLinksEnabled"] === "boolean" &&
      loadedData["annotatedLinksEnabled"] &&
      "annotationStrings" in loadedData &&
      typeof loadedData["annotationStrings"] === "string"
    ) {
      loadedData["displayOrderOfLinks"] = parsePrefixStrings(
        loadedData["annotationStrings"],
        true,
        false
      );
      loadedData["annotationStrings"] = parsePrefixStrings(
        loadedData["annotationStrings"],
        true,
        false
      );
    }

    if (
      "usePropertyAsDisplayName" in loadedData &&
      typeof loadedData["usePropertyAsDisplayName"] === "boolean" &&
      loadedData["usePropertyAsDisplayName"] &&
      "displayPropertyName" in loadedData &&
      typeof loadedData["displayPropertyName"] === "string"
    ) {
      loadedData["propertyNameForDisplayText"] = loadedData["displayPropertyName"];
    }

    if (
      "propertyMappings" in loadedData &&
      loadedData["propertyMappings"] instanceof Array &&
      loadedData["propertyMappings"].length > 0 &&
      "emoji" in loadedData["propertyMappings"][0]
    ) {
      loadedData["propertyMappings"] = loadedData["propertyMappings"]
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
    }

    if ("dailyNoteLinksEnabled" in loadedData) {
      loadedData["prevNextLinksEnabledInDailyNotes"] = loadedData["dailyNoteLinksEnabled"];
    }

    if ("weeklyNoteLinksEnabled" in loadedData) {
      loadedData["prevNextLinksEnabledInWeeklyNotes"] = loadedData["weeklyNoteLinksEnabled"];
    }

    if ("monthlyNoteLinksEnabled" in loadedData) {
      loadedData["prevNextLinksEnabledInMonthlyNotes"] = loadedData["monthlyNoteLinksEnabled"];
    }

    if ("quarterlyNoteLinksEnabled" in loadedData) {
      loadedData["prevNextLinksEnabledInQuarterlyNotes"] = loadedData["quarterlyNoteLinksEnabled"];
    }

    if ("yearlyNoteLinksEnabled" in loadedData) {
      loadedData["prevNextLinksEnabledInYearlyNotes"] = loadedData["yearlyNoteLinksEnabled"];
    }

    delete loadedData["annotatedLinksEnabled"];
    delete loadedData["usePropertyAsDisplayName"];
    delete loadedData["displayPropertyName"];
    delete loadedData["dailyNoteLinksEnabled"];
    delete loadedData["weeklyNoteLinksEnabled"];
    delete loadedData["monthlyNoteLinksEnabled"];
    delete loadedData["quarterlyNoteLinksEnabled"];
    delete loadedData["yearlyNoteLinksEnabled"];
  }

  if (lt(version, "2.2.0")) {
    if (!("displayInLeaves" in loadedData) && "displayInMarkdownViews" in loadedData) {
      loadedData["displayInLeaves"] = loadedData["displayInMarkdownViews"];
      loadedData["displayInMarkdownViews"] = DEFAULT_SETTINGS.displayInMarkdownViews;
    }
  }

  if (lt(version, "2.5.0")) {
    if (
      "previousLinkProperty" in loadedData &&
      typeof loadedData["previousLinkProperty"] === "string" &&
      loadedData["previousLinkProperty"].length > 0
    ) {
      loadedData["previousLinkPropertyMappings"] = [
        { property: loadedData["previousLinkProperty"], prefix: "" },
      ];
    }

    if (
      "nextLinkProperty" in loadedData &&
      typeof loadedData["nextLinkProperty"] === "string" &&
      loadedData["nextLinkProperty"].length > 0
    ) {
      loadedData["nextLinkPropertyMappings"] = [
        { property: loadedData["nextLinkProperty"], prefix: "" },
      ];
    }

    if (
      "parentLinkProperty" in loadedData &&
      typeof loadedData["parentLinkProperty"] === "string" &&
      loadedData["parentLinkProperty"].length > 0
    ) {
      loadedData["parentLinkPropertyMappings"] = [
        { property: loadedData["parentLinkProperty"], prefix: "" },
      ];
    }

    delete loadedData["previousLinkProperty"];
    delete loadedData["nextLinkProperty"];
    delete loadedData["parentLinkProperty"];
  }

  if (lt(version, "2.6.0")) {
    if (
      "folderLinksSettingsArray" in loadedData &&
      loadedData["folderLinksSettingsArray"] instanceof Array
    ) {
      for (let i = 0; i < loadedData["folderLinksSettingsArray"].length; i++) {
        const loadedSubData = loadedData["folderLinksSettingsArray"][i] as Record<string, unknown>;
        if (
          "folderPath" in loadedSubData &&
          typeof loadedSubData["folderPath"] === "string" &&
          loadedSubData["folderPath"].length > 0
        ) {
          loadedSubData["folderPaths"] = [loadedSubData["folderPath"]];
        }

        if (
          "filterRegex" in loadedSubData &&
          typeof loadedSubData["filterRegex"] === "string" &&
          loadedSubData["filterRegex"].length > 0
        ) {
          loadedSubData["includePatterns"] = [loadedSubData["filterRegex"]];
          loadedSubData["enableRegex"] = true;
        }

        delete loadedSubData["folderPath"];
        delete loadedSubData["filterRegex"];
      }
    }
  }

  if (lt(version, "2.7.1")) {
    if ("annotationStrings" in loadedData) {
      loadedData["annotationStringsForBacklinks"] = loadedData["annotationStrings"];
    }
    if ("advancedAnnotationStrings" in loadedData) {
      loadedData["advancedAnnotationStringsForBacklinks"] = loadedData["advancedAnnotationStrings"];
    }

    delete loadedData["annotationStrings"];
    delete loadedData["advancedAnnotationStrings"];
  }

  loadedData["version"] = DEFAULT_SETTINGS.version;
  return loadedData;
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
      .setName("Match navigation header width to line length")
      .setDesc(
        `
          If enabled, the width of the navigation header will match the line length of the note.
          Here, "line length" refers to the width defined when Obsidian's "Readable line length"
          option is enabled.
        `
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
        `
          Specify the display order of links using prefix strings (e.g., emojis).
          For example:
          ${DISPLAY_ORDER_PLACEHOLDER_PERIODIC}, ${DISPLAY_ORDER_PLACEHOLDER_PROPERTY},
          ${DISPLAY_ORDER_PLACEHOLDER_FOLDER}, 🏠, ⬆️, 📌, 🔗.
          Links are sorted according to the order of the prefix strings listed here.
          "${DISPLAY_ORDER_PLACEHOLDER_PERIODIC}", "${DISPLAY_ORDER_PLACEHOLDER_PROPERTY}",
          and "${DISPLAY_ORDER_PLACEHOLDER_FOLDER}" are special strings that represent
          periodic note links, previous/next/parent property links, and folder links, respectively.
        `
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
        `
          If you want to use file properties to specify the note's display text, set the property
          name to this field. Leave this field blank if you are not using this feature.
        `
      )
      .addText((text) => {
        text
          .setValue(this.plugin.settingsUnderChange.propertyNameForDisplayText)
          .setPlaceholder("title")
          .onChange((value) => {
            this.plugin.settingsUnderChange.propertyNameForDisplayText = value.trim();
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl)
      .setName("Filter duplicate links")
      .setDesc(
        `
          Filter out duplicates when multiple links with the same destination are detected.
          This setting does not apply to prev/next/parent-type links and pinned note contents.
        `
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.filterDuplicateNotes).onChange((value) => {
          this.plugin.settingsUnderChange.filterDuplicateNotes = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Duplicate link filtering priority")
      .setDesc(
        `
          Specify the filtering priority.
          For example, if you specify 🏠,⬆️,📌,🔗 here,
          links with "🏠" will be displayed with the highest priority.
        `
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
      .setName("Item collapse prefixes")
      .setDesc(
        `
          Items whose prefix (e.g., an emoji) matches any of these strings will be collapsed into
          a single entry.
          Prefixes can also be added or removed by clicking them in the navigation header.
        `
      )
      .addText((text) => {
        const prefixes = this.plugin.settingsUnderChange.itemCollapsePrefixes.join(",");
        text.setValue(prefixes).onChange((value) => {
          this.plugin.settingsUnderChange.itemCollapsePrefixes = parsePrefixStrings(
            value,
            this.plugin.settings.trimStringsInSettings,
            false
          );
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display loading message")
      .setDesc(
        `
          Display a loading message ("Loading...") in the navigation header
          while links are being loaded.
        `
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayLoadingMessage).onChange((value) => {
          this.plugin.settingsUnderChange.displayLoadingMessage = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display placeholder")
      .setDesc(
        `
          Display a placeholder("No links") when there is nothing to display.
        `
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayPlaceholder).onChange((value) => {
          this.plugin.settingsUnderChange.displayPlaceholder = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Confirm when creating a new file")
      .setDesc(
        `
          Display a confirmation dialog when a new file is created.
          This option is currently only used for periodic notes.
        `
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.confirmFileCreation).onChange((value) => {
          this.plugin.settingsUnderChange.confirmFileCreation = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    const affectedSettings = [
      "Display order of links",
      "Duplicate link filtering priority",
      "Item collapse prefixes",
      "Annotation strings for backlinks",
      "Annotation strings for current note",
      "Advanced annotation strings for backlinks",
      "Advanced annotation strings for current note",
      "Previous note property mappings",
      "Next note property mappings",
      "Parent note property mappings",
      "Annotation strings (Pinned note content)",
      "Start marker",
      "End marker",
      "Include patterns",
      "Exclude patterns",
      "Link prefix",
    ]
      .map((s) => `"${s}"`)
      .join(", ");
    new Setting(containerEl)
      .setName("Trim whitespace in input fields")
      .setDesc(
        `
          When enabled, leading and trailing whitespace will be trimmed from the strings
          entered in the settings below.
          Disable this option if you want to include spaces intentionally.
          Affected settings: ${affectedSettings}.
        `
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.trimStringsInSettings).onChange((value) => {
          this.plugin.settingsUnderChange.trimStringsInSettings = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl).setName("Display targets").setHeading();

    new Setting(containerEl)
      .setName("Display navigation header in panes")
      .setDesc(
        `
          Show navigation header when notes are opened in panes.
          This setting applies to note containers (panes). To show the navigation header,
          also enable view-specific options below.
        `
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInLeaves).onChange((value) => {
          this.plugin.settingsUnderChange.displayInLeaves = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display navigation header in page previews")
      .setDesc(
        `
          Show navigation header when notes are shown in page previews.
          This setting applies to note containers (page previews).
          To show the navigation header, also enable view-specific options below.
        `
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
      .setName("Display navigation header in Markdown views")
      .setDesc("Show navigation header when viewing Markdown documents.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange.displayInMarkdownViews)
          .onChange((value) => {
            this.plugin.settingsUnderChange.displayInMarkdownViews = value;
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl)
      .setName("Display navigation header in Image views")
      .setDesc("Show navigation header when viewing images.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInImageViews).onChange((value) => {
          this.plugin.settingsUnderChange.displayInImageViews = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display navigation header in Video views")
      .setDesc("Show navigation header when viewing videos.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInVideoViews).onChange((value) => {
          this.plugin.settingsUnderChange.displayInVideoViews = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display navigation header in Audio views")
      .setDesc("Show navigation header when viewing audio.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInAudioViews).onChange((value) => {
          this.plugin.settingsUnderChange.displayInAudioViews = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display navigation header in PDF views")
      .setDesc("Show navigation header when viewing PDFs.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInPdfViews).onChange((value) => {
          this.plugin.settingsUnderChange.displayInPdfViews = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display navigation header in Canvas views")
      .setDesc("Show navigation header when viewing Canvas.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInCanvasViews).onChange((value) => {
          this.plugin.settingsUnderChange.displayInCanvasViews = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display navigation header in Bases views")
      .setDesc("Show navigation header when viewing Bases.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInBasesViews).onChange((value) => {
          this.plugin.settingsUnderChange.displayInBasesViews = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Display navigation header in other views")
      .setDesc(
        `
          Show navigation header in other views (such as views introduced by community plugins).
          This may not work depending on the view type.
        `
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settingsUnderChange.displayInOtherViews).onChange((value) => {
          this.plugin.settingsUnderChange.displayInOtherViews = value;
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl).setName("Annotated links").setHeading();

    new Setting(containerEl)
      .setName("Annotation strings for backlinks")
      .setDesc(
        `
          Define the annotation strings.
          If one of the annotation strings (e.g., emojis) is placed immediately before
          a link in a note content, the link is recognized as an annotated link.
          Notes with annotated links appear as backlinks in the navigation header of the
          destination note. Any string, including emoji, is acceptable as long as the following
          link is recognized as a link (Wikilink or Markdown link).
          To specify multiple annotations, separate them with commas. e.g., 📌,🔗.
          ${EMOJI_ANNOTATION_PLACEHOLDER} can be used as a special placeholder
          that represents any single emoji. For example, if you specify only
          ${EMOJI_ANNOTATION_PLACEHOLDER}, all links preceded by an emoji will be matched.
          It can also be mixed with other entries, e.g., ${EMOJI_ANNOTATION_PLACEHOLDER}📌,🔗.
          Leave this field blank if you are not using this feature.
        `
      )
      .addText((text) => {
        const annotations = this.plugin.settingsUnderChange.annotationStringsForBacklinks.join(",");
        text.setValue(annotations).onChange((value) => {
          this.plugin.settingsUnderChange.annotationStringsForBacklinks = parsePrefixStrings(
            value,
            this.plugin.settings.trimStringsInSettings,
            false
          );
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Annotation strings for current note")
      .setDesc(
        `
          Define the annotation strings for links in the current note.
          This setting works the same way as "Annotation strings for backlinks",
          but applies to links in the current note.
        `
      )
      .addText((text) => {
        const annotations =
          this.plugin.settingsUnderChange.annotationStringsForCurrentNote.join(",");
        text.setValue(annotations).onChange((value) => {
          this.plugin.settingsUnderChange.annotationStringsForCurrentNote = parsePrefixStrings(
            value,
            this.plugin.settings.trimStringsInSettings,
            false
          );
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Hide prefixes in the navigation header")
      .setDesc("If enabled, prefixes (e.g., emojis) will be hidden in the navigation header.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settingsUnderChange.hideAnnotatedLinkPrefix)
          .onChange((value) => {
            this.plugin.settingsUnderChange.hideAnnotatedLinkPrefix = value;
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl)
      .setName("Advanced annotation strings for backlinks")
      .setDesc(
        `
          An advanced version of "Annotation strings for backlinks".
          This setting allows regular expressions to be used as
          annotation strings and any prefix (e.g., an emoji) to be assigned for display
          in the navigation header.
          Enter one mapping per line using the format regex:prefix.
          To include a colon in the prefix, escape it as "\\:".
          An empty string is also acceptable as a prefix.
        `
      )
      .addTextArea((text) => {
        const annotations = this.plugin.settingsUnderChange.advancedAnnotationStringsForBacklinks
          .map((annotation) => `${annotation.regex}:${annotation.prefix.replace(/:/g, "\\:")}`)
          .join("\n");
        text
          .setValue(annotations)
          .setPlaceholder("📌:🔗\n(?:^|\\n)-:\n\\[\\[E\\]\\]:🔗")
          .onChange((value) => {
            this.plugin.settingsUnderChange.advancedAnnotationStringsForBacklinks =
              parseAdvancedAnnotationStrings(value, this.plugin.settings.trimStringsInSettings);
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl)
      .setName("Advanced annotation strings for current note")
      .setDesc(
        `
          An advanced version of "Annotation strings for current note".
          The syntax is the same as that of "Advanced annotation strings for backlinks".
        `
      )
      .addTextArea((text) => {
        const annotations = this.plugin.settingsUnderChange.advancedAnnotationStringsForCurrentNote
          .map((annotation) => `${annotation.regex}:${annotation.prefix.replace(/:/g, "\\:")}`)
          .join("\n");
        text.setValue(annotations).onChange((value) => {
          this.plugin.settingsUnderChange.advancedAnnotationStringsForCurrentNote =
            parseAdvancedAnnotationStrings(value, this.plugin.settings.trimStringsInSettings);
          this.plugin.triggerSettingsChangedDebounced();
        });
      });

    new Setting(containerEl)
      .setName("Allow a space between the annotation string and the link")
      .setDesc(
        `
          If enabled, a link will still be recognized as an annotated link even if there is a
          space between the annotation string and the link.
        `
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

    new Setting(containerEl).setName("Property links").setHeading();

    new Setting(containerEl)
      .setName("Property mappings")
      .setDesc(
        `
          Define the property mappings.
          If the file property specified here points to a specific note,
          that note will be displayed in the navigation header
          (URLs to the website are also supported).
          Each mapping consists of a property name and a string that will
          be placed at the beginning of the link when it appears in the navigation header
          (use emojis in this string if you want it to appear like an icon).
          Each line should be in the format property_name:prefix.
          To include a colon in the prefix, escape it as \\:.
          An empty string is also acceptable as a prefix.
          Leave this field blank if you are not using this feature.
        `
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

    new Setting(containerEl)
      .setName("Previous note property mappings")
      .setDesc(
        `
          Enter the mapping that specifies the previous note. The note specified here will appear
          in the navigation header as < previous | parent | next >.
          The syntax is the same as "Property mappings".
        `
      )
      .addTextArea((text) => {
        const mappings = this.plugin.settingsUnderChange.previousLinkPropertyMappings
          .map((mapping) => `${mapping.property}:${mapping.prefix.replace(/:/g, "\\:")}`)
          .join("\n");
        text
          .setValue(mappings)
          .setPlaceholder("previous:")
          .onChange((value) => {
            this.plugin.settingsUnderChange.previousLinkPropertyMappings = parsePropertyMappings(
              value,
              this.plugin.settings.trimStringsInSettings
            );
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl)
      .setName("Next note property mappings")
      .setDesc(
        `
          Enter the mapping that specifies the next note. The note specified here will appear
          in the navigation header as < previous | parent | next >.
          The syntax is the same as "Property mappings".
        `
      )
      .addTextArea((text) => {
        const mappings = this.plugin.settingsUnderChange.nextLinkPropertyMappings
          .map((mapping) => `${mapping.property}:${mapping.prefix.replace(/:/g, "\\:")}`)
          .join("\n");
        text
          .setValue(mappings)
          .setPlaceholder("next:")
          .onChange((value) => {
            this.plugin.settingsUnderChange.nextLinkPropertyMappings = parsePropertyMappings(
              value,
              this.plugin.settings.trimStringsInSettings
            );
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl)
      .setName("Parent note property mappings")
      .setDesc(
        `
          Enter the mapping that specifies the parent note. The note specified here will appear
          in the navigation header as < previous | parent | next >.
          The syntax is the same as "Property mappings".
        `
      )
      .addTextArea((text) => {
        const mappings = this.plugin.settingsUnderChange.parentLinkPropertyMappings
          .map((mapping) => `${mapping.property}:${mapping.prefix.replace(/:/g, "\\:")}`)
          .join("\n");
        text
          .setValue(mappings)
          .setPlaceholder("parent:\nup:")
          .onChange((value) => {
            this.plugin.settingsUnderChange.parentLinkPropertyMappings = parsePropertyMappings(
              value,
              this.plugin.settings.trimStringsInSettings
            );
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl)
      .setName("Implicit reciprocal property pairs")
      .setDesc(
        `
          Specify pairs of property names here to implicitly create reciprocal links
          in the navigation header. For example, if you enter prev:next here,
          when Note A has a property "next: [[Note B]]", Note B will be treated as if
          it also had "prev: [[Note A]]" even if it isn't explicitly set.
          Enter one pair per line.
        `
      )
      .addTextArea((text) => {
        const pairs = this.plugin.settingsUnderChange.implicitReciprocalPropertyPairs
          .map((pair) => `${pair.propertyA}:${pair.propertyB}`)
          .join("\n");
        text
          .setValue(pairs)
          .setPlaceholder("prev:next\nparent:child")
          .onChange((value) => {
            this.plugin.settingsUnderChange.implicitReciprocalPropertyPairs =
              parsePropertyPairs(value);
            this.plugin.triggerSettingsChangedDebounced();
          });
      });

    new Setting(containerEl).setName("Periodic note links").setHeading();

    new Setting(containerEl)
      .setName("Display previous and next links in daily notes")
      .setDesc(
        `
          To use this option, daily notes must be enabled
          in Daily Notes plugin or Periodic Notes plugin.
        `
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
            value !== "none" ? (value as IGranularity) : "none";
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
            value !== "none" ? (value as IGranularity) : "none";
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
            value !== "none" ? (value as IGranularity) : "none";
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
            value !== "none" ? (value as IGranularity) : "none";
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

    new Setting(containerEl).setName("Pinned note content").setHeading();

    new Setting(containerEl)
      .setName("Annotation strings")
      .setDesc(
        `
          Display part of the current note in the navigation header.
          The text shown starts immediately after the specified annotation string and
          continues up to the end of the line.
          If the start and end markers defined below appear immediately after
          the annotation string, only the content between those markers is displayed instead.
          Example: 📌[[note 1]]/[[note 2]](end of line) → 📌[[note 1]]/[[note 2]],
          📌([[note 1]]/[[note 2]])[[note 3]] → 📌[[note 1]]/[[note 2]].
          To specify multiple annotations, separate them with commas.
        `
      )
      .addText((text) => {
        const annotations = this.plugin.settingsUnderChange.annotationStringsForPinning.join(",");
        text
          .setValue(annotations)
          .onChange((value) => {
            this.plugin.settingsUnderChange.annotationStringsForPinning = parsePrefixStrings(
              value,
              this.plugin.settings.trimStringsInSettings,
              false
            );
            this.plugin.triggerSettingsChangedDebounced();
          })
          .setPlaceholder("📌,🔗");
      });

    new Setting(containerEl).setName("Start marker").addText((text) => {
      text
        .setValue(this.plugin.settingsUnderChange.startMarkerForPinning)
        .onChange((value) => {
          this.plugin.settingsUnderChange.startMarkerForPinning = this.plugin.settingsUnderChange
            .trimStringsInSettings
            ? value.trim()
            : value;
          this.plugin.triggerSettingsChangedDebounced();
        })
        .setPlaceholder("(");
    });

    new Setting(containerEl).setName("End marker").addText((text) => {
      text
        .setValue(this.plugin.settingsUnderChange.endMarkerForPinning)
        .onChange((value) => {
          this.plugin.settingsUnderChange.endMarkerForPinning = this.plugin.settingsUnderChange
            .trimStringsInSettings
            ? value.trim()
            : value;
          this.plugin.triggerSettingsChangedDebounced();
        })
        .setPlaceholder(")");
    });

    new Setting(containerEl).setName("Folder links").setHeading();

    const folderLinksSettingsArray = this.plugin.settingsUnderChange.folderLinksSettingsArray;
    for (let i = 0; i < folderLinksSettingsArray.length; i++) {
      const folderLinkSettings = folderLinksSettingsArray[i];

      // The actual index will be the number shown here - 1.
      new Setting(containerEl).setName(`Folder setting #${i + 1}`).setHeading();

      new Setting(containerEl)
        .setName("Folder paths")
        .setDesc(
          `
            For each folder specified here, files in the same folder as the currently opened file
            will be shown in the navigation header. Multiple folders can be specified
            (enter one path per line). Glob patterns are supported
            (e.g., **: all folders; *: all folders directly under root;
            folder/*: all folders directly under "folder").
          `
        )
        .addTextArea((text) => {
          text
            .setValue(folderLinkSettings.folderPaths.join("\n"))
            .setPlaceholder("path/to/the/folder\nanother/folder/*")
            .onChange((value) => {
              folderLinkSettings.folderPaths = parseMultiLineInput(value, true);
              this.plugin.triggerSettingsChangedDebounced();
            });
        });

      new Setting(containerEl)
        .setName("Excluded folder paths")
        .setDesc(
          `
            Specify the folder paths to exclude. Multiple folders can be specified
            (enter one path per line). Glob patterns are supported.
          `
        )
        .addTextArea((text) => {
          text
            .setValue(folderLinkSettings.excludedFolderPaths.join("\n"))
            .setPlaceholder("path/to/the/folder\nanother/folder/*")
            .onChange((value) => {
              folderLinkSettings.excludedFolderPaths = parseMultiLineInput(value, true);
              this.plugin.triggerSettingsChangedDebounced();
            });
        });

      new Setting(containerEl)
        .setName("Recursive")
        .setDesc("Whether to include files in subfolders.")
        .addToggle((toggle) => {
          toggle.setValue(folderLinkSettings.recursive).onChange((value) => {
            folderLinkSettings.recursive = value;
            this.plugin.triggerSettingsChangedDebounced();
          });
        });

      new Setting(containerEl)
        .setName("Include patterns")
        .setDesc(
          `
            Include files that match these patterns partially. Enter one per line.
            Leave empty for all files.
          `
        )
        .addTextArea((text) => {
          text
            .setValue(folderLinkSettings.includePatterns.join("\n"))
            .setPlaceholder("Chapter\n.pdf")
            .onChange((value) => {
              folderLinkSettings.includePatterns = parseMultiLineInput(
                value,
                this.plugin.settings.trimStringsInSettings
              );
              this.plugin.triggerSettingsChangedDebounced();
            });
        });

      new Setting(containerEl)
        .setName("Exclude patterns")
        .setDesc("Exclude files that match these patterns partially. Enter one per line.")
        .addTextArea((text) => {
          text
            .setValue(folderLinkSettings.excludePatterns.join("\n"))
            .setPlaceholder(".canvas")
            .onChange((value) => {
              folderLinkSettings.excludePatterns = parseMultiLineInput(
                value,
                this.plugin.settings.trimStringsInSettings
              );
              this.plugin.triggerSettingsChangedDebounced();
            });
        });

      new Setting(containerEl)
        .setName("Enable regular expressions")
        .setDesc("Whether to enable regular expressions for include/exclude patterns.")
        .addToggle((toggle) => {
          toggle.setValue(folderLinkSettings.enableRegex).onChange((value) => {
            folderLinkSettings.enableRegex = value;
            this.plugin.triggerSettingsChangedDebounced();
          });
        });

      new Setting(containerEl)
        .setName("Filter by")
        .setDesc(
          "Specify whether to use file names or property values for include/exclude patterns."
        )
        .addDropdown((dropdown) => {
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
          `
            The name of the property to filter by.
            This is required when "Filter by" is set to "Property".
          `
        )
        .addText((text) => {
          text.setValue(folderLinkSettings.filterPropertyName).onChange((value) => {
            folderLinkSettings.filterPropertyName = value.trim();
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
          `
            The name of the property to sort by.
            This is required when "Sort by" is set to "Property".
          `
        )
        .addText((text) => {
          text.setValue(folderLinkSettings.sortPropertyName).onChange((value) => {
            folderLinkSettings.sortPropertyName = value.trim();
            this.plugin.triggerSettingsChangedDebounced();
          });
        });

      new Setting(containerEl)
        .setName("Max links")
        .setDesc(
          `
            The maximum number of folder links to display.
            For example, if set to 3, the display would look like
            <prev3 prev2 prev1 | parent | next1 next2 next3>.
          `
        )
        .addText((text) => {
          text.inputEl.type = "number";
          text.setValue(String(folderLinkSettings.maxLinks)).onChange((value) => {
            let n = Number(value);
            n = Number.isFinite(n) ? n : DEFAULT_FOLDER_LINKS_SETTINGS.maxLinks;
            n = Math.floor(n);
            n = n < 1 ? 1 : n;
            folderLinkSettings.maxLinks = n;
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
        .setName("Link display style")
        .setDesc(
          `
            Specify the display style of prev/next/parent links in the navigation header.
            Full: < previous | parent | next >, Separator: previous | parent | next,
            None: previous parent next.
          `
        )
        .addDropdown((dropdown) => {
          dropdown
            .addOptions({
              full: "Full",
              separator: "Separator",
              none: "None",
            })
            .setValue(folderLinkSettings.displayStyle)
            .onChange((value) => {
              folderLinkSettings.displayStyle = value as "full" | "separator" | "none";
              this.plugin.triggerSettingsChangedDebounced();
            });
        });

      new Setting(containerEl)
        .setName("Link prefix")
        .setDesc("The string to display before each link (e.g., an emoji).")
        .addText((text) => {
          text.setValue(folderLinkSettings.linkPrefix).onChange((value) => {
            folderLinkSettings.linkPrefix = this.plugin.settings.trimStringsInSettings
              ? value.trim()
              : value;
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
            .setButtonText("Remove")
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
        .setButtonText("Add folder setting")
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
function parsePrefixStrings(prefixes: string, trim: boolean, allowEmpty: boolean): string[] {
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
): { regex: string; prefix: string }[] {
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
): { property: string; prefix: string }[] {
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

/**
 * Parses the string with multiple lines of "propertyA:propertyB",
 * and returns an array of property pairs.
 */
function parsePropertyPairs(pairs: string): { propertyA: string; propertyB: string }[] {
  return pairs
    .split("\n")
    .filter((line) => line.includes(":"))
    .map((pair) => {
      const i = pair.lastIndexOf(":");
      const propertyA = pair.slice(0, i);
      const propertyB = pair.slice(i + 1);

      // Since Obsidian automatically trims property names, we always trim them here too.
      return {
        propertyA: propertyA.trim(),
        propertyB: propertyB.trim(),
      };
    })
    .filter((mapping) => mapping.propertyA.length > 0 && mapping.propertyB.length > 0);
}

/**
 * Parses a multi-line input into an array of strings.
 * If `trim` is true, leading and trailing whitespace from each line is removed.
 * Empty lines are filtered out.
 */
function parseMultiLineInput(input: string, trim: boolean): string[] {
  return input
    .split("\n")
    .map((line) => (trim ? line.trim() : line))
    .filter((line) => line.length > 0);
}
