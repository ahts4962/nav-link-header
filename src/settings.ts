import {
  Modal,
  normalizePath,
  PluginSettingTab,
  Setting,
  SettingGroup,
  setIcon,
  setTooltip,
} from "obsidian";
import type { IGranularity } from "obsidian-daily-notes-interface";
import { lt } from "semver";
import type NavLinkHeader from "./main";
import {
  DISPLAY_ORDER_PLACEHOLDER_FOLDER,
  DISPLAY_ORDER_PLACEHOLDER_PERIODIC,
  DISPLAY_ORDER_PLACEHOLDER_PROPERTY,
} from "./itemPropsContainer";
import { EMOJI_ANNOTATION_PLACEHOLDER } from "./annotatedLink";
import type { ThreeWayDelimiters } from "./ui/props";
import { deepCopy } from "./utils";
import { t } from "./i18n/i18n";

export interface NavLinkHeaderSettings {
  version: string;
  matchNavigationWidthToLineLength: boolean;
  displayOrderOfLinks: string[];
  propertyNameForDisplayText: string;
  filterDuplicateNotes: boolean;
  duplicateNoteFilteringPriority: string[];
  itemCollapsePrefixes: string[];
  mergePrefixes: string[];
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
  propertyLinkDisplayStyle: ThreeWayDelimiters;
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
  periodicNoteLinkDisplayStyle: ThreeWayDelimiters;
  periodicNoteLinkPrefix: string;
  annotationStringsForPinning: string[];
  startMarkerForPinning: string;
  endMarkerForPinning: string;
  ignoreCodeBlocksInPinning: boolean;
  folderLinksSettingsArray: FolderLinksSettings[];
}

export interface FolderLinksSettings {
  ruleName: string;
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
  displayStyle: ThreeWayDelimiters;
  linkPrefix: string;
}

export const DEFAULT_SETTINGS: NavLinkHeaderSettings = {
  version: "2.7.3",
  matchNavigationWidthToLineLength: false,
  displayOrderOfLinks: [],
  propertyNameForDisplayText: "",
  filterDuplicateNotes: true,
  duplicateNoteFilteringPriority: [],
  itemCollapsePrefixes: [],
  mergePrefixes: [],
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
  propertyLinkDisplayStyle: "full",
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
  periodicNoteLinkDisplayStyle: "full",
  periodicNoteLinkPrefix: "",
  annotationStringsForPinning: [],
  startMarkerForPinning: "",
  endMarkerForPinning: "",
  ignoreCodeBlocksInPinning: false,
  folderLinksSettingsArray: [],
};

const DEFAULT_FOLDER_LINKS_SETTINGS: FolderLinksSettings = {
  ruleName: "",
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
              DEFAULT_FOLDER_LINKS_SETTINGS,
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
        false,
      );
      loadedData["annotationStrings"] = parsePrefixStrings(
        loadedData["annotationStrings"],
        true,
        false,
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
  private activeTabId: string = "common";
  private collapsedFolderLinkSettings = new WeakSet<FolderLinksSettings>();

  constructor(private plugin: NavLinkHeader) {
    super(plugin.app, plugin);
  }

  public display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const msg = t().setting;

    const threeWayDelimiterOptions =
      msg.threeWayDelimiterOptions satisfies Record<ThreeWayDelimiters, string>;

    const tabsEl = containerEl.createDiv();
    tabsEl.style.display = "flex";
    tabsEl.style.flexWrap = "wrap";
    tabsEl.style.gap = "8px";
    tabsEl.style.marginBottom = "12px";

    const panelsEl = containerEl.createDiv();

    const tabButtons = new Map<string, HTMLButtonElement>();
    const tabPanels = new Map<string, HTMLDivElement>();

    const createPanel = (id: string, label: string): HTMLDivElement => {
      const button = tabsEl.createEl("button", { text: label, cls: "mod-muted" });
      button.setAttr("type", "button");
      button.style.cursor = "pointer";

      const panel = panelsEl.createDiv();
      panel.style.display = "none";

      button.addEventListener("click", () => {
        this.activeTabId = id;
        for (const [tabId, tabButton] of tabButtons.entries()) {
          const isActive = tabId === id;
          tabButton.classList.toggle("mod-cta", isActive);
          tabButton.classList.toggle("mod-muted", !isActive);
          tabButton.setAttr("aria-pressed", String(isActive));
        }
        for (const [tabId, tabPanel] of tabPanels.entries()) {
          tabPanel.style.display = tabId === id ? "block" : "none";
        }
      });

      tabButtons.set(id, button);
      tabPanels.set(id, panel);
      return panel;
    };

    const commonPanel = createPanel("common", msg.tabs.common);
    const enabledViewsPanel = createPanel("enabledViews", msg.tabs.enabledViews);
    const annotatedLinksPanel = createPanel("annotatedLinks", msg.tabs.annotatedLinks);
    const pinnedContentPanel = createPanel("pinnedContent", msg.tabs.pinnedContent);
    const propertyLinksPanel = createPanel("propertyLinks", msg.tabs.propertyLinks);
    const periodicNotesPanel = createPanel("periodicNotes", msg.tabs.periodicNotes);
    const folderLinksPanel = createPanel("folderLinks", msg.tabs.folderLinks);

    const initialTabId = tabButtons.has(this.activeTabId) ? this.activeTabId : "common";
    tabButtons.get(initialTabId)?.click();

    new SettingGroup(commonPanel)
      .addSetting((setting) => {
        setting
          .setName(msg.general.pluginGuide.name)
          .setDesc(msg.general.pluginGuide.desc)
          .addButton((button) => {
            button.setButtonText(msg.general.pluginGuide.linkLabel).onClick(() => {
              window.open("https://github.com/ahts4962/nav-link-header", "_blank");
            });
          });
      })
      .addSetting((setting) => {
        const affectedSettings = msg.general.trimWhitespaceInInputFields.affectedSettings
          .map((s) => `"${s}"`)
          .join(", ");

        setting
          .setName(msg.general.trimWhitespaceInInputFields.name)
          .setDesc(msg.general.trimWhitespaceInInputFields.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.trimStringsInSettings)
              .onChange((value) => {
                this.plugin.settingsUnderChange.trimStringsInSettings = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });

        this.addTooltipToDescription(
          setting,
          msg.general.trimWhitespaceInInputFields.descTooltip.replace(
            "{affectedSettings}",
            affectedSettings,
          ),
        );
      })
      .addSetting((setting) => {
        setting
          .setName(msg.general.displayLoadingMessage.name)
          .setDesc(msg.general.displayLoadingMessage.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.displayLoadingMessage)
              .onChange((value) => {
                this.plugin.settingsUnderChange.displayLoadingMessage = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.general.displayPlaceholder.name)
          .setDesc(msg.general.displayPlaceholder.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.displayPlaceholder)
              .onChange((value) => {
                this.plugin.settingsUnderChange.displayPlaceholder = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      ;

    new SettingGroup(commonPanel)
      .setHeading(msg.sections.display)
      .addSetting((setting) => {
        setting
          .setName(msg.general.matchNavigationWidthToLineLength.name)
          .setDesc(msg.general.matchNavigationWidthToLineLength.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.matchNavigationWidthToLineLength)
              .onChange((value) => {
                this.plugin.settingsUnderChange.matchNavigationWidthToLineLength = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.general.displayOrderOfLinks.name)
          .setDesc(
            msg.general.displayOrderOfLinks.desc
              .replaceAll("{periodic}", DISPLAY_ORDER_PLACEHOLDER_PERIODIC)
              .replaceAll("{property}", DISPLAY_ORDER_PLACEHOLDER_PROPERTY)
              .replaceAll("{folder}", DISPLAY_ORDER_PLACEHOLDER_FOLDER),
          )
          .addText((text) => {
            const order = this.plugin.settingsUnderChange.displayOrderOfLinks.join(",");
            text.setValue(order).onChange((value) => {
              this.plugin.settingsUnderChange.displayOrderOfLinks = parsePrefixStrings(
                value,
                this.plugin.settings.trimStringsInSettings,
                true,
              );
              this.plugin.triggerSettingsChangedDebounced();
            });
          });

        this.addTooltipToDescription(
          setting,
          msg.general.displayOrderOfLinks.descTooltip
            .replaceAll("{periodic}", DISPLAY_ORDER_PLACEHOLDER_PERIODIC)
            .replaceAll("{property}", DISPLAY_ORDER_PLACEHOLDER_PROPERTY)
            .replaceAll("{folder}", DISPLAY_ORDER_PLACEHOLDER_FOLDER),
        );
        this.addTipToDescription(setting, msg.general.displayOrderOfLinks.tip);
      })
      .addSetting((setting) => {
        setting
          .setName(msg.general.propertyNameForDisplayText.name)
          .setDesc(msg.general.propertyNameForDisplayText.desc)
          .addText((text) => {
            text
              .setValue(this.plugin.settingsUnderChange.propertyNameForDisplayText)
              .setPlaceholder(msg.general.propertyNameForDisplayText.placeholder)
              .onChange((value) => {
                this.plugin.settingsUnderChange.propertyNameForDisplayText = value.trim();
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.general.filterDuplicateLinks.name)
          .setDesc(msg.general.filterDuplicateLinks.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.filterDuplicateNotes)
              .onChange((value) => {
                this.plugin.settingsUnderChange.filterDuplicateNotes = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.general.duplicateLinkFilteringPriority.name)
          .setDesc(msg.general.duplicateLinkFilteringPriority.desc)
          .addText((text) => {
            const priority =
              this.plugin.settingsUnderChange.duplicateNoteFilteringPriority.join(",");
            text.setValue(priority).onChange((value) => {
              this.plugin.settingsUnderChange.duplicateNoteFilteringPriority = parsePrefixStrings(
                value,
                this.plugin.settings.trimStringsInSettings,
                true,
              );
              this.plugin.triggerSettingsChangedDebounced();
            });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.general.itemCollapsePrefixes.name)
          .setDesc(msg.general.itemCollapsePrefixes.desc)
          .addText((text) => {
            const prefixes = this.plugin.settingsUnderChange.itemCollapsePrefixes.join(",");
            text.setValue(prefixes).onChange((value) => {
              this.plugin.settingsUnderChange.itemCollapsePrefixes = parsePrefixStrings(
                value,
                this.plugin.settings.trimStringsInSettings,
                false,
              );
              this.plugin.triggerSettingsChangedDebounced();
            });
          });

        this.addTipToDescription(setting, msg.general.itemCollapsePrefixes.tip);
      })
      .addSetting((setting) => {
        setting
          .setName(msg.general.mergePrefixes.name)
          .setDesc(msg.general.mergePrefixes.desc)
          .addText((text) => {
            const prefixes = this.plugin.settingsUnderChange.mergePrefixes.join(",");
            text.setValue(prefixes).onChange((value) => {
              this.plugin.settingsUnderChange.mergePrefixes = parsePrefixStrings(
                value,
                this.plugin.settings.trimStringsInSettings,
                false,
              );
              this.plugin.triggerSettingsChangedDebounced();
            });
          });

        this.addTipToDescription(setting, msg.general.mergePrefixes.tip);
      });

    new SettingGroup(enabledViewsPanel)
      .setHeading(msg.sections.displayPosition)
      .addSetting((setting) => {
        setting
          .setName(msg.displayTargets.inPanes.name)
          .setDesc(msg.displayTargets.inPanes.desc)
          .addToggle((toggle) => {
            toggle.setValue(this.plugin.settingsUnderChange.displayInLeaves).onChange((value) => {
              this.plugin.settingsUnderChange.displayInLeaves = value;
              this.plugin.triggerSettingsChangedDebounced();
            });
          });

        this.addTipToDescription(setting, msg.displayTargets.inPanes.tip);
      })
      .addSetting((setting) => {
        setting
          .setName(msg.displayTargets.inPagePreviews.name)
          .setDesc(msg.displayTargets.inPagePreviews.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.displayInHoverPopovers)
              .onChange((value) => {
                this.plugin.settingsUnderChange.displayInHoverPopovers = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });

        this.addTipToDescription(setting, msg.displayTargets.inPagePreviews.tip);
      });

    new SettingGroup(enabledViewsPanel)
      .setHeading(msg.sections.enabledViews)
      .addSetting((setting) => {
        setting
          .setName(msg.displayTargets.inMarkdownViews.name)
          .setDesc(msg.displayTargets.inMarkdownViews.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.displayInMarkdownViews)
              .onChange((value) => {
                this.plugin.settingsUnderChange.displayInMarkdownViews = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.displayTargets.inImageViews.name)
          .setDesc(msg.displayTargets.inImageViews.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.displayInImageViews)
              .onChange((value) => {
                this.plugin.settingsUnderChange.displayInImageViews = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.displayTargets.inVideoViews.name)
          .setDesc(msg.displayTargets.inVideoViews.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.displayInVideoViews)
              .onChange((value) => {
                this.plugin.settingsUnderChange.displayInVideoViews = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.displayTargets.inAudioViews.name)
          .setDesc(msg.displayTargets.inAudioViews.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.displayInAudioViews)
              .onChange((value) => {
                this.plugin.settingsUnderChange.displayInAudioViews = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.displayTargets.inPdfViews.name)
          .setDesc(msg.displayTargets.inPdfViews.desc)
          .addToggle((toggle) => {
            toggle.setValue(this.plugin.settingsUnderChange.displayInPdfViews).onChange((value) => {
              this.plugin.settingsUnderChange.displayInPdfViews = value;
              this.plugin.triggerSettingsChangedDebounced();
            });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.displayTargets.inCanvasViews.name)
          .setDesc(msg.displayTargets.inCanvasViews.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.displayInCanvasViews)
              .onChange((value) => {
                this.plugin.settingsUnderChange.displayInCanvasViews = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.displayTargets.inBasesViews.name)
          .setDesc(msg.displayTargets.inBasesViews.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.displayInBasesViews)
              .onChange((value) => {
                this.plugin.settingsUnderChange.displayInBasesViews = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.displayTargets.inOtherViews.name)
          .setDesc(msg.displayTargets.inOtherViews.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.displayInOtherViews)
              .onChange((value) => {
                this.plugin.settingsUnderChange.displayInOtherViews = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      });

    new SettingGroup(annotatedLinksPanel)
      .addSetting((setting) => {
        setting
          .setName(msg.annotatedLinks.annotationStringsForBacklinks.name)
          .setDesc(
            msg.annotatedLinks.annotationStringsForBacklinks.desc.replaceAll(
              "{emojiPlaceholder}",
              EMOJI_ANNOTATION_PLACEHOLDER,
            ),
          )
          .addText((text) => {
            const annotations =
              this.plugin.settingsUnderChange.annotationStringsForBacklinks.join(",");
            text.setValue(annotations).onChange((value) => {
              this.plugin.settingsUnderChange.annotationStringsForBacklinks = parsePrefixStrings(
                value,
                this.plugin.settings.trimStringsInSettings,
                false,
              );
              this.plugin.triggerSettingsChangedDebounced();
            });
          });

        this.addTooltipToDescription(
          setting,
          msg.annotatedLinks.annotationStringsForBacklinksTooltip.replaceAll(
            "{emojiPlaceholder}",
            EMOJI_ANNOTATION_PLACEHOLDER,
          ),
        );
        this.addTipToDescription(setting, msg.annotatedLinks.annotationStringsForBacklinks.tip);
      })
      .addSetting((setting) => {
        setting
          .setName(msg.annotatedLinks.annotationStringsForCurrentNote.name)
          .setDesc(msg.annotatedLinks.annotationStringsForCurrentNote.desc)
          .addText((text) => {
            const annotations =
              this.plugin.settingsUnderChange.annotationStringsForCurrentNote.join(",");
            text.setValue(annotations).onChange((value) => {
              this.plugin.settingsUnderChange.annotationStringsForCurrentNote = parsePrefixStrings(
                value,
                this.plugin.settings.trimStringsInSettings,
                false,
              );
              this.plugin.triggerSettingsChangedDebounced();
            });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.annotatedLinks.hidePrefixes.name)
          .setDesc(msg.annotatedLinks.hidePrefixes.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.hideAnnotatedLinkPrefix)
              .onChange((value) => {
                this.plugin.settingsUnderChange.hideAnnotatedLinkPrefix = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.annotatedLinks.advancedAnnotationStringsForBacklinks.name)
          .setDesc(msg.annotatedLinks.advancedAnnotationStringsForBacklinks.desc)
          .addTextArea((text) => {
            const annotations =
              this.plugin.settingsUnderChange.advancedAnnotationStringsForBacklinks
                .map(
                  (annotation) => `${annotation.regex}:${annotation.prefix.replace(/:/g, "\\:")}`,
                )
                .join("\n");
            text
              .setValue(annotations)
              .setPlaceholder(msg.annotatedLinks.advancedAnnotationStringsForBacklinks.placeholder)
              .onChange((value) => {
                this.plugin.settingsUnderChange.advancedAnnotationStringsForBacklinks =
                  parseAdvancedAnnotationStrings(value, this.plugin.settings.trimStringsInSettings);
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.annotatedLinks.advancedAnnotationStringsForCurrentNote.name)
          .setDesc(msg.annotatedLinks.advancedAnnotationStringsForCurrentNote.desc)
          .addTextArea((text) => {
            const annotations =
              this.plugin.settingsUnderChange.advancedAnnotationStringsForCurrentNote
                .map(
                  (annotation) => `${annotation.regex}:${annotation.prefix.replace(/:/g, "\\:")}`,
                )
                .join("\n");
            text.setValue(annotations).onChange((value) => {
              this.plugin.settingsUnderChange.advancedAnnotationStringsForCurrentNote =
                parseAdvancedAnnotationStrings(value, this.plugin.settings.trimStringsInSettings);
              this.plugin.triggerSettingsChangedDebounced();
            });
          });

        this.addTipToDescription(setting, msg.annotatedLinks.advancedAnnotationStringsForCurrentNote.tip);
      })
      .addSetting((setting) => {
        setting
          .setName(msg.annotatedLinks.allowSpaceAfterAnnotationString.name)
          .setDesc(msg.annotatedLinks.allowSpaceAfterAnnotationString.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.allowSpaceAfterAnnotationString)
              .onChange((value) => {
              this.plugin.settingsUnderChange.allowSpaceAfterAnnotationString = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.annotatedLinks.ignoreVariationSelectors.name)
          .setDesc(msg.annotatedLinks.ignoreVariationSelectors.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.ignoreVariationSelectors)
              .onChange((value) => {
                this.plugin.settingsUnderChange.ignoreVariationSelectors = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      });

    new SettingGroup(propertyLinksPanel)
      .addSetting((setting) => {
        setting
          .setName(msg.propertyLinks.propertyMappings.name)
          .setDesc(msg.propertyLinks.propertyMappings.desc)
          .addTextArea((text) => {
            const mappings = this.plugin.settingsUnderChange.propertyMappings
              .map((mapping) => `${mapping.property}:${mapping.prefix.replace(/:/g, "\\:")}`)
              .join("\n");
            text
              .setValue(mappings)
              .setPlaceholder(msg.propertyLinks.propertyMappings.placeholder)
              .onChange((value) => {
                this.plugin.settingsUnderChange.propertyMappings = parsePropertyMappings(
                  value,
                  this.plugin.settings.trimStringsInSettings,
                );
                this.plugin.triggerSettingsChangedDebounced();
              });
          });

        this.addTipToDescription(setting, msg.propertyLinks.propertyMappings.tip);
      })
      .addSetting((setting) => {
        setting
          .setName(msg.propertyLinks.previousNotePropertyMappings.name)
          .setDesc(msg.propertyLinks.previousNotePropertyMappings.desc)
          .addTextArea((text) => {
            const mappings = this.plugin.settingsUnderChange.previousLinkPropertyMappings
              .map((mapping) => `${mapping.property}:${mapping.prefix.replace(/:/g, "\\:")}`)
              .join("\n");
            text
              .setValue(mappings)
              .setPlaceholder(msg.propertyLinks.previousNotePropertyMappings.placeholder)
              .onChange((value) => {
                this.plugin.settingsUnderChange.previousLinkPropertyMappings =
                  parsePropertyMappings(value, this.plugin.settings.trimStringsInSettings);
              this.plugin.triggerSettingsChangedDebounced();
            });
          });

        this.addTipToDescription(setting, msg.propertyLinks.previousNotePropertyMappings.tip);
      })
      .addSetting((setting) => {
        setting
          .setName(msg.propertyLinks.nextNotePropertyMappings.name)
          .setDesc(msg.propertyLinks.nextNotePropertyMappings.desc)
          .addTextArea((text) => {
            const mappings = this.plugin.settingsUnderChange.nextLinkPropertyMappings
              .map((mapping) => `${mapping.property}:${mapping.prefix.replace(/:/g, "\\:")}`)
              .join("\n");
            text
              .setValue(mappings)
              .setPlaceholder(msg.propertyLinks.nextNotePropertyMappings.placeholder)
              .onChange((value) => {
                this.plugin.settingsUnderChange.nextLinkPropertyMappings = parsePropertyMappings(
                  value,
                  this.plugin.settings.trimStringsInSettings,
                );
              this.plugin.triggerSettingsChangedDebounced();
            });
          });

        this.addTipToDescription(setting, msg.propertyLinks.nextNotePropertyMappings.tip);
      })
      .addSetting((setting) => {
        setting
          .setName(msg.propertyLinks.parentNotePropertyMappings.name)
          .setDesc(msg.propertyLinks.parentNotePropertyMappings.desc)
          .addTextArea((text) => {
            const mappings = this.plugin.settingsUnderChange.parentLinkPropertyMappings
              .map((mapping) => `${mapping.property}:${mapping.prefix.replace(/:/g, "\\:")}`)
              .join("\n");
            text
              .setValue(mappings)
              .setPlaceholder(msg.propertyLinks.parentNotePropertyMappings.placeholder)
              .onChange((value) => {
                this.plugin.settingsUnderChange.parentLinkPropertyMappings = parsePropertyMappings(
                  value,
                  this.plugin.settings.trimStringsInSettings,
                );
              this.plugin.triggerSettingsChangedDebounced();
            });
          });

        this.addTipToDescription(setting, msg.propertyLinks.parentNotePropertyMappings.tip);
      })
      .addSetting((setting) => {
        setting
          .setName(msg.propertyLinks.linkDisplayStyle.name)
          .setDesc(msg.propertyLinks.linkDisplayStyle.desc)
          .addDropdown((dropdown) => {
            dropdown
              .addOptions(threeWayDelimiterOptions)
              .setValue(this.plugin.settingsUnderChange.propertyLinkDisplayStyle)
              .onChange((value) => {
                this.plugin.settingsUnderChange.propertyLinkDisplayStyle =
                  value as ThreeWayDelimiters;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.propertyLinks.implicitReciprocalPropertyPairs.name)
          .setDesc(msg.propertyLinks.implicitReciprocalPropertyPairs.desc)
          .addTextArea((text) => {
            const pairs = this.plugin.settingsUnderChange.implicitReciprocalPropertyPairs
              .map((pair) => `${pair.propertyA}:${pair.propertyB}`)
              .join("\n");
            text
              .setValue(pairs)
              .setPlaceholder(msg.propertyLinks.implicitReciprocalPropertyPairs.placeholder)
              .onChange((value) => {
                this.plugin.settingsUnderChange.implicitReciprocalPropertyPairs =
                  parsePropertyPairs(value);
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      });

    new SettingGroup(periodicNotesPanel)
      .setHeading(msg.periodicNotes.sections.daily)
      .addSetting((setting) => {
        setting
          .setName(msg.periodicNotes.displayPrevNextInDailyNotes.name)
          .setDesc(msg.periodicNotes.displayPrevNextInDailyNotes.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.prevNextLinksEnabledInDailyNotes)
              .onChange((value) => {
                this.plugin.settingsUnderChange.prevNextLinksEnabledInDailyNotes = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting.setName(msg.periodicNotes.parentForDailyNotes.name).addDropdown((dropdown) => {
          dropdown
            .addOptions({
              none: msg.periodicNotes.granularityOptions.none,
              week: msg.periodicNotes.granularityOptions.week,
              month: msg.periodicNotes.granularityOptions.month,
              quarter: msg.periodicNotes.granularityOptions.quarter,
              year: msg.periodicNotes.granularityOptions.year,
            })
            .setValue(this.plugin.settingsUnderChange.parentLinkGranularityInDailyNotes ?? "none")
            .onChange((value) => {
              this.plugin.settingsUnderChange.parentLinkGranularityInDailyNotes =
                value !== "none" ? (value as IGranularity) : "none";
              this.plugin.triggerSettingsChangedDebounced();
            });
        });
      });

    new SettingGroup(periodicNotesPanel)
      .setHeading(msg.periodicNotes.sections.weekly)
      .addSetting((setting) => {
        setting
          .setName(msg.periodicNotes.displayPrevNextInWeeklyNotes.name)
          .setDesc(msg.periodicNotes.displayPrevNextInWeeklyNotes.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.prevNextLinksEnabledInWeeklyNotes)
              .onChange((value) => {
                this.plugin.settingsUnderChange.prevNextLinksEnabledInWeeklyNotes = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting.setName(msg.periodicNotes.parentForWeeklyNotes.name).addDropdown((dropdown) => {
          dropdown
            .addOptions({
              none: msg.periodicNotes.granularityOptions.none,
              month: msg.periodicNotes.granularityOptions.month,
              quarter: msg.periodicNotes.granularityOptions.quarter,
              year: msg.periodicNotes.granularityOptions.year,
            })
            .setValue(this.plugin.settingsUnderChange.parentLinkGranularityInWeeklyNotes ?? "none")
            .onChange((value) => {
              this.plugin.settingsUnderChange.parentLinkGranularityInWeeklyNotes =
                value !== "none" ? (value as IGranularity) : "none";
              this.plugin.triggerSettingsChangedDebounced();
            });
        });
      });

    new SettingGroup(periodicNotesPanel)
      .setHeading(msg.periodicNotes.sections.monthly)
      .addSetting((setting) => {
        setting
          .setName(msg.periodicNotes.displayPrevNextInMonthlyNotes.name)
          .setDesc(msg.periodicNotes.displayPrevNextInMonthlyNotes.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.prevNextLinksEnabledInMonthlyNotes)
              .onChange((value) => {
                this.plugin.settingsUnderChange.prevNextLinksEnabledInMonthlyNotes = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting.setName(msg.periodicNotes.parentForMonthlyNotes.name).addDropdown((dropdown) => {
          dropdown
            .addOptions({
              none: msg.periodicNotes.granularityOptions.none,
              quarter: msg.periodicNotes.granularityOptions.quarter,
              year: msg.periodicNotes.granularityOptions.year,
            })
            .setValue(this.plugin.settingsUnderChange.parentLinkGranularityInMonthlyNotes ?? "none")
            .onChange((value) => {
              this.plugin.settingsUnderChange.parentLinkGranularityInMonthlyNotes =
                value !== "none" ? (value as IGranularity) : "none";
              this.plugin.triggerSettingsChangedDebounced();
            });
        });
      });

    new SettingGroup(periodicNotesPanel)
      .setHeading(msg.periodicNotes.sections.quarterly)
      .addSetting((setting) => {
        setting
          .setName(msg.periodicNotes.displayPrevNextInQuarterlyNotes.name)
          .setDesc(msg.periodicNotes.displayPrevNextInQuarterlyNotes.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.prevNextLinksEnabledInQuarterlyNotes)
              .onChange((value) => {
                this.plugin.settingsUnderChange.prevNextLinksEnabledInQuarterlyNotes = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting.setName(msg.periodicNotes.parentForQuarterlyNotes.name).addDropdown((dropdown) => {
          dropdown
            .addOptions({
              none: msg.periodicNotes.granularityOptions.none,
              year: msg.periodicNotes.granularityOptions.year,
            })
            .setValue(this.plugin.settingsUnderChange.parentLinkGranularityInQuarterlyNotes ?? "none")
            .onChange((value) => {
              this.plugin.settingsUnderChange.parentLinkGranularityInQuarterlyNotes =
                value !== "none" ? (value as IGranularity) : "none";
              this.plugin.triggerSettingsChangedDebounced();
            });
        });
      });

    new SettingGroup(periodicNotesPanel)
      .setHeading(msg.periodicNotes.sections.yearly)
      .addSetting((setting) => {
        setting
          .setName(msg.periodicNotes.displayPrevNextInYearlyNotes.name)
          .setDesc(msg.periodicNotes.displayPrevNextInYearlyNotes.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.prevNextLinksEnabledInYearlyNotes)
              .onChange((value) => {
                this.plugin.settingsUnderChange.prevNextLinksEnabledInYearlyNotes = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.general.confirmFileCreation.name)
          .setDesc(msg.general.confirmFileCreation.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.confirmFileCreation)
              .onChange((value) => {
                this.plugin.settingsUnderChange.confirmFileCreation = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.periodicNotes.linkDisplayStyle.name)
          .setDesc(msg.periodicNotes.linkDisplayStyle.desc)
          .addDropdown((dropdown) => {
            dropdown
              .addOptions(threeWayDelimiterOptions)
              .setValue(this.plugin.settingsUnderChange.periodicNoteLinkDisplayStyle)
              .onChange((value) => {
                this.plugin.settingsUnderChange.periodicNoteLinkDisplayStyle =
                  value as ThreeWayDelimiters;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.periodicNotes.linkPrefix.name)
          .setDesc(msg.periodicNotes.linkPrefix.desc)
          .addText((text) => {
            text
              .setValue(this.plugin.settingsUnderChange.periodicNoteLinkPrefix)
              .onChange((value) => {
                this.plugin.settingsUnderChange.periodicNoteLinkPrefix = this.plugin.settings
                  .trimStringsInSettings
                  ? value.trim()
                  : value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      });

    new SettingGroup(pinnedContentPanel)
      .addSetting((setting) => {
        setting
          .setName(msg.pinnedContent.annotationStrings.name)
          .setDesc(msg.pinnedContent.annotationStrings.desc)
          .addText((text) => {
            const annotations =
              this.plugin.settingsUnderChange.annotationStringsForPinning.join(",");
            text
              .setValue(annotations)
              .onChange((value) => {
                this.plugin.settingsUnderChange.annotationStringsForPinning = parsePrefixStrings(
                  value,
                this.plugin.settings.trimStringsInSettings,
                false,
              );
              this.plugin.triggerSettingsChangedDebounced();
            })
            .setPlaceholder(msg.pinnedContent.annotationStrings.placeholder);
          });

        this.addTipToDescription(setting, msg.pinnedContent.annotationStrings.tip);
      })
      .addSetting((setting) => {
        setting.setName(msg.pinnedContent.startMarker.name).addText((text) => {
          text
            .setValue(this.plugin.settingsUnderChange.startMarkerForPinning)
            .onChange((value) => {
              this.plugin.settingsUnderChange.startMarkerForPinning = this.plugin
                .settingsUnderChange.trimStringsInSettings
                ? value.trim()
                : value;
              this.plugin.triggerSettingsChangedDebounced();
            })
            .setPlaceholder(msg.pinnedContent.startMarker.placeholder);
        });
      })
      .addSetting((setting) => {
        setting.setName(msg.pinnedContent.endMarker.name).addText((text) => {
          text
            .setValue(this.plugin.settingsUnderChange.endMarkerForPinning)
            .onChange((value) => {
              this.plugin.settingsUnderChange.endMarkerForPinning = this.plugin.settingsUnderChange
                .trimStringsInSettings
                ? value.trim()
                : value;
              this.plugin.triggerSettingsChangedDebounced();
            })
            .setPlaceholder(msg.pinnedContent.endMarker.placeholder);
        });
      })
      .addSetting((setting) => {
        setting
          .setName(msg.pinnedContent.ignoreCodeBlocks.name)
          .setDesc(msg.pinnedContent.ignoreCodeBlocks.desc)
          .addToggle((toggle) => {
            toggle
              .setValue(this.plugin.settingsUnderChange.ignoreCodeBlocksInPinning)
              .onChange((value) => {
                this.plugin.settingsUnderChange.ignoreCodeBlocksInPinning = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
      });

    const folderLinksSettingsArray = this.plugin.settingsUnderChange.folderLinksSettingsArray;

    const addFolderSettingRow = folderLinksPanel.createDiv();
    addFolderSettingRow.style.display = "flex";
    addFolderSettingRow.style.justifyContent = "flex-end";
    addFolderSettingRow.style.marginBottom = "10px";

    const addFolderSettingButton = addFolderSettingRow.createEl("button", {
      text: msg.folderLinks.controls.addFolderSetting,
      cls: "mod-cta",
    });
    addFolderSettingButton.setAttr("type", "button");
    addFolderSettingButton.addEventListener("click", () => {
      this.plugin.settingsUnderChange.folderLinksSettingsArray.push(
        deepCopy(DEFAULT_FOLDER_LINKS_SETTINGS),
      );
      this.plugin.triggerSettingsChangedDebounced();
      this.display();
    });

    for (let i = 0; i < folderLinksSettingsArray.length; i++) {
      const folderLinkSettings = folderLinksSettingsArray[i];
      const ruleDisplayName =
        folderLinkSettings.ruleName.trim() || msg.folderLinks.folderSettingHeading(i + 1);

      const isCollapsed = this.collapsedFolderLinkSettings.has(folderLinkSettings);

      const folderLinksSettingGroup = new SettingGroup(folderLinksPanel);

      folderLinksSettingGroup
        .addSetting((setting) => {
          setting
            .setName("")
            .addButton((button) => {
              button.buttonEl.style.marginLeft = "auto";
              button.setButtonText(msg.folderLinks.controls.pinToTop).onClick(() => {
                this.swapFolderLinksSettings(i, 0);
                this.plugin.triggerSettingsChangedDebounced();
                this.display();
              });
            })
            .addButton((button) => {
              button.setButtonText(msg.folderLinks.controls.moveUp).onClick(() => {
                this.swapFolderLinksSettings(i, i - 1);
                this.plugin.triggerSettingsChangedDebounced();
                this.display();
              });
            })
            .addButton((button) => {
              button.setButtonText(msg.folderLinks.controls.moveDown).onClick(() => {
                this.swapFolderLinksSettings(i, i + 1);
                this.plugin.triggerSettingsChangedDebounced();
                this.display();
              });
            })
            .addButton((button) => {
              button
                .setButtonText(msg.folderLinks.controls.remove)
                .setWarning()
                .onClick(() => {
                  folderLinksSettingsArray.splice(i, 1);
                  this.plugin.triggerSettingsChangedDebounced();
                  this.display();
                });
            });

          const nameEl = setting.nameEl;
          nameEl.empty();
          nameEl.style.display = "flex";
          nameEl.style.alignItems = "center";
          nameEl.style.gap = "6px";

          const collapseToggleEl = nameEl.createEl("button", {
            cls: "clickable-icon",
          });
          collapseToggleEl.setAttr("type", "button");
          collapseToggleEl.style.padding = "0";
          collapseToggleEl.style.minWidth = "16px";
          collapseToggleEl.style.minHeight = "16px";
          collapseToggleEl.style.border = "none";
          collapseToggleEl.style.background = "transparent";
          collapseToggleEl.style.display = "inline-flex";
          collapseToggleEl.style.alignItems = "center";
          collapseToggleEl.style.justifyContent = "center";
          collapseToggleEl.style.transform = isCollapsed ? "rotate(-90deg)" : "rotate(0deg)";
          collapseToggleEl.style.transition = "transform 0.2s ease-in-out";
          setIcon(collapseToggleEl, "chevron-down");
          collapseToggleEl.addEventListener("click", () => {
            if (this.collapsedFolderLinkSettings.has(folderLinkSettings)) {
              this.collapsedFolderLinkSettings.delete(folderLinkSettings);
            } else {
              this.collapsedFolderLinkSettings.add(folderLinkSettings);
            }
            this.display();
          });

          const ruleNameEl = nameEl.createEl("span", { text: ruleDisplayName });
          ruleNameEl.style.cursor = "pointer";
          ruleNameEl.style.fontWeight = "var(--font-medium)";
          ruleNameEl.style.userSelect = "none";
          ruleNameEl.addEventListener("click", () => {
            new FolderRuleNameModal(
              this.plugin,
              msg.folderLinks.controls.rename,
              ruleDisplayName,
              (renamed) => {
                folderLinkSettings.ruleName = renamed.trim();
                this.plugin.triggerSettingsChangedDebounced();
                this.display();
              },
            ).open();
          });
        });

      if (isCollapsed) {
        continue;
      }

      folderLinksSettingGroup
        .addSetting((setting) => {
          setting
            .setName(msg.folderLinks.folderPaths.name)
            .setDesc(msg.folderLinks.folderPaths.desc)
            .addTextArea((text) => {
              text
                .setValue(folderLinkSettings.folderPaths.join("\n"))
                .setPlaceholder(msg.folderLinks.folderPaths.placeholder)
                .onChange((value) => {
                  folderLinkSettings.folderPaths = parseMultiLineInput(value, true);
                  this.plugin.triggerSettingsChangedDebounced();
                });
            });
        })
        .addSetting((setting) => {
          setting
            .setName(msg.folderLinks.excludedFolderPaths.name)
            .setDesc(msg.folderLinks.excludedFolderPaths.desc)
            .addTextArea((text) => {
              text
                .setValue(folderLinkSettings.excludedFolderPaths.join("\n"))
                .setPlaceholder(msg.folderLinks.excludedFolderPaths.placeholder)
                .onChange((value) => {
                  folderLinkSettings.excludedFolderPaths = parseMultiLineInput(value, true);
                  this.plugin.triggerSettingsChangedDebounced();
                });
            });
        })
        .addSetting((setting) => {
          setting
            .setName(msg.folderLinks.recursive.name)
            .setDesc(msg.folderLinks.recursive.desc)
            .addToggle((toggle) => {
              toggle.setValue(folderLinkSettings.recursive).onChange((value) => {
                folderLinkSettings.recursive = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
            });
        })
        .addSetting((setting) => {
          setting
            .setName(msg.folderLinks.includePatterns.name)
            .setDesc(msg.folderLinks.includePatterns.desc)
            .addTextArea((text) => {
              text
                .setValue(folderLinkSettings.includePatterns.join("\n"))
                .setPlaceholder(msg.folderLinks.includePatterns.placeholder)
                .onChange((value) => {
                  folderLinkSettings.includePatterns = parseMultiLineInput(
                    value,
                    this.plugin.settings.trimStringsInSettings,
                  );
                  this.plugin.triggerSettingsChangedDebounced();
                });
            });
        })
        .addSetting((setting) => {
          setting
            .setName(msg.folderLinks.excludePatterns.name)
            .setDesc(msg.folderLinks.excludePatterns.desc)
            .addTextArea((text) => {
              text
                .setValue(folderLinkSettings.excludePatterns.join("\n"))
                .setPlaceholder(msg.folderLinks.excludePatterns.placeholder)
                .onChange((value) => {
                  folderLinkSettings.excludePatterns = parseMultiLineInput(
                    value,
                    this.plugin.settings.trimStringsInSettings,
                  );
                  this.plugin.triggerSettingsChangedDebounced();
                });
            });
        })
        .addSetting((setting) => {
          setting
            .setName(msg.folderLinks.enableRegex.name)
            .setDesc(msg.folderLinks.enableRegex.desc)
            .addToggle((toggle) => {
              toggle.setValue(folderLinkSettings.enableRegex).onChange((value) => {
                folderLinkSettings.enableRegex = value;
                this.plugin.triggerSettingsChangedDebounced();
              });
            });
        })
        .addSetting((setting) => {
          setting
            .setName(msg.folderLinks.filterBy.name)
            .setDesc(msg.folderLinks.filterBy.desc)
            .addDropdown((dropdown) => {
              dropdown
                .addOptions({
                  filename: msg.folderLinks.filterBy.options.filename,
                  property: msg.folderLinks.filterBy.options.property,
                })
                .setValue(folderLinkSettings.filterBy)
                .onChange((value) => {
                  folderLinkSettings.filterBy = value as "filename" | "property";
                  this.plugin.triggerSettingsChangedDebounced();
                });
            });
        })
        .addSetting((setting) => {
          setting
            .setName(msg.folderLinks.propertyNameToFilterBy.name)
            .setDesc(msg.folderLinks.propertyNameToFilterBy.desc)
            .addText((text) => {
              text.setValue(folderLinkSettings.filterPropertyName).onChange((value) => {
                folderLinkSettings.filterPropertyName = value.trim();
                this.plugin.triggerSettingsChangedDebounced();
              });
            });
        })
        .addSetting((setting) => {
          setting.setName(msg.folderLinks.sortOrder.name).addDropdown((dropdown) => {
            dropdown
              .addOptions({
                asc: msg.folderLinks.sortOrder.options.asc,
                desc: msg.folderLinks.sortOrder.options.desc,
              })
              .setValue(folderLinkSettings.sortOrder)
              .onChange((value) => {
                folderLinkSettings.sortOrder = value as "asc" | "desc";
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
        })
        .addSetting((setting) => {
          setting.setName(msg.folderLinks.sortBy.name).addDropdown((dropdown) => {
            dropdown
              .addOptions({
                filename: msg.folderLinks.sortBy.options.filename,
                created: msg.folderLinks.sortBy.options.created,
                modified: msg.folderLinks.sortBy.options.modified,
                property: msg.folderLinks.sortBy.options.property,
              })
              .setValue(folderLinkSettings.sortBy)
              .onChange((value) => {
                folderLinkSettings.sortBy = value as
                  | "filename"
                  | "created"
                  | "modified"
                  | "property";
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
        })
        .addSetting((setting) => {
          setting
            .setName(msg.folderLinks.propertyNameToSortBy.name)
            .setDesc(msg.folderLinks.propertyNameToSortBy.desc)
            .addText((text) => {
              text.setValue(folderLinkSettings.sortPropertyName).onChange((value) => {
                folderLinkSettings.sortPropertyName = value.trim();
                this.plugin.triggerSettingsChangedDebounced();
              });
            });
        })
        .addSetting((setting) => {
          setting
            .setName(msg.folderLinks.maxLinks.name)
            .setDesc(msg.folderLinks.maxLinks.desc)
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
        })
        .addSetting((setting) => {
          setting.setName(msg.folderLinks.pathToParentNote.name).addText((text) => {
            text
              .setValue(folderLinkSettings.parentPath)
              .setPlaceholder(msg.folderLinks.pathToParentNote.placeholder)
              .onChange((value) => {
                const trimmed = value.trim();
                folderLinkSettings.parentPath = trimmed === "" ? "" : normalizePath(trimmed);
                this.plugin.triggerSettingsChangedDebounced();
              });
          });
        })
        .addSetting((setting) => {
          setting
            .setName(msg.folderLinks.linkDisplayStyle.name)
            .setDesc(msg.folderLinks.linkDisplayStyle.desc)
            .addDropdown((dropdown) => {
              dropdown
                .addOptions(threeWayDelimiterOptions)
                .setValue(folderLinkSettings.displayStyle)
                .onChange((value) => {
                  folderLinkSettings.displayStyle = value as ThreeWayDelimiters;
                  this.plugin.triggerSettingsChangedDebounced();
                });
            });
        })
        .addSetting((setting) => {
          setting
            .setName(msg.folderLinks.linkPrefix.name)
            .setDesc(msg.folderLinks.linkPrefix.desc)
            .addText((text) => {
              text.setValue(folderLinkSettings.linkPrefix).onChange((value) => {
                folderLinkSettings.linkPrefix = this.plugin.settings.trimStringsInSettings
                  ? value.trim()
                  : value;
                this.plugin.triggerSettingsChangedDebounced();
              });
            });
        })
        ;
    }

    this.applyDescriptionLineBreaks(containerEl);
  }

  private applyDescriptionLineBreaks(root: HTMLElement): void {
    const descriptionElements = root.querySelectorAll<HTMLElement>(".setting-item-description");

    for (const descEl of descriptionElements) {
      descEl.style.whiteSpace = "pre-line";
      descEl.style.lineHeight = "1.45";
      descEl.style.marginTop = "4px";
    }
  }

  private addTipToDescription(setting: { descEl: HTMLElement }, tipText: string): void {
    const content = tipText.trim();
    if (content.length === 0) {
      return;
    }

    const tipEl = document.createElement("span");
    tipEl.className = "nav-link-header-tip-text header-tip-etxt";
    tipEl.textContent = content;
    setting.descEl.appendChild(document.createElement("br"));
    setting.descEl.appendChild(tipEl);
  }

  private addTooltipToDescription(setting: { descEl: HTMLElement }, tooltipText: string): void {
    const content = tooltipText.trim();
    if (content.length === 0) {
      return;
    }

    const icon = document.createElement("span");
    icon.style.display = "inline-flex";
    icon.style.verticalAlign = "text-bottom";
    icon.style.marginLeft = "4px";
    icon.style.cursor = "help";
    icon.style.width = "16px";
    icon.style.height = "16px";
    setIcon(icon, "info");
    const svgEl = icon.querySelector("svg");
    if (svgEl instanceof SVGElement) {
      svgEl.style.width = "16px";
      svgEl.style.height = "16px";
    }
    setTooltip(icon, content);
    setting.descEl.appendChild(icon);
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

class FolderRuleNameModal extends Modal {
  private value: string;

  constructor(
    private plugin: NavLinkHeader,
    private title: string,
    initialValue: string,
    private onSubmit: (value: string) => void,
  ) {
    super(plugin.app);
    this.value = initialValue;
  }

  public onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: this.title });
    new Setting(contentEl).addText((text) => {
      text.setValue(this.value).onChange((value) => {
        this.value = value;
      });
      text.inputEl.focus();
      text.inputEl.select();
    });

    new Setting(contentEl)
      .addButton((button) => {
        button.setButtonText("保存").setCta().onClick(() => {
          this.onSubmit(this.value);
          this.close();
        });
      })
      .addButton((button) => {
        button.setButtonText("取消").onClick(() => {
          this.close();
        });
      });
  }

  public onClose(): void {
    this.contentEl.empty();
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
 * `\:` can be used to escape colons in prefixes.
 * The regex and prefix are split at the last unescaped colon.
 */
function parseAdvancedAnnotationStrings(
  annotations: string,
  trim: boolean,
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
  trim: boolean,
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
