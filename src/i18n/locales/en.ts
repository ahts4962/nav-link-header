import type { BaseMessage } from "../types";

const en: BaseMessage = {
  setting: {
    threeWayDelimiterOptions: {
      full: "Full",
      "full-double-separator": "Full (double separator)",
      separator: "Separator",
      "double-separator": "Double separator",
      none: "None",
    },
    general: {
      matchNavigationWidthToLineLength: {
        name: "Match navigation header width to line length",
        desc: `If enabled, the width of the navigation header will match the line length of the note.
Here, "line length" refers to the width defined when Obsidian's "Readable line length"
option is enabled.`,
      },
      displayOrderOfLinks: {
        name: "Display order of links",
        desc: `Specify the display order of links using prefix strings (e.g., emojis).
For example:
{periodic}, {property}, {folder}, 🏠, ⬆️, 📌, 🔗.
Links are sorted according to the order of the prefix strings listed here.
"{periodic}", "{property}", and "{folder}" are special strings that represent periodic
note links, previous/next/parent property links, and folder links, respectively.`,
      },
      propertyNameForDisplayText: {
        name: "Property name to specify display text",
        desc: `If you want to use file properties to specify the note's display text, set the
property name to this field. Leave this field blank if you are not using this feature.`,
        placeholder: "title",
      },
      filterDuplicateLinks: {
        name: "Filter duplicate links",
        desc: `Filter out duplicates when multiple links with the same destination are detected.
This setting does not apply to prev/next/parent-type links and pinned note contents.`,
      },
      duplicateLinkFilteringPriority: {
        name: "Duplicate link filtering priority",
        desc: `Specify the filtering priority.
For example, if you specify 🏠,⬆️,📌,🔗 here,
links with "🏠" will be displayed with the highest priority.`,
      },
      itemCollapsePrefixes: {
        name: "Item collapse prefixes",
        desc: `Items whose prefix (e.g., an emoji) matches any of these strings will be collapsed
into a single entry.
Prefixes can also be added or removed by clicking them in the navigation header.`,
      },
      mergePrefixes: {
        name: "Merge prefixes",
        desc: `Specify the prefixes to merge. For example, setting 🔗 will merge links like
🔗[[Note 1]] 🔗[[Note 2]] 🔗[[Note 3]] into 🔗[[Note 1]] [[Note 2]] [[Note 3]]
in the navigation header.
Multiple prefixes can be specified by separating them with commas.`,
      },
      displayLoadingMessage: {
        name: "Display loading message",
        desc: `Display a loading message ("Loading...") in the navigation header
while links are being loaded.`,
      },
      displayPlaceholder: {
        name: "Display placeholder",
        desc: `Display a placeholder ("No links") when there is nothing to display.`,
      },
      confirmFileCreation: {
        name: "Confirm when creating a new file",
        desc: `Display a confirmation dialog when a new file is created.
This option is currently only used for periodic notes.`,
      },
      trimWhitespaceInInputFields: {
        name: "Trim whitespace in input fields",
        desc: `When enabled, leading and trailing whitespace will be trimmed from the strings
entered in the settings below.
Disable this option if you want to include spaces intentionally.
Affected settings: {affectedSettings}.`,
        affectedSettings: [
          "Display order of links",
          "Duplicate link filtering priority",
          "Item collapse prefixes",
          "Merge prefixes",
          "Annotation strings for backlinks",
          "Annotation strings for current note",
          "Advanced annotation strings for backlinks",
          "Advanced annotation strings for current note",
          "Previous note property mappings",
          "Next note property mappings",
          "Parent note property mappings",
          "Link prefix (Periodic note links)",
          "Annotation strings (Pinned note content)",
          "Start marker",
          "End marker",
          "Include patterns",
          "Exclude patterns",
          "Link prefix (Folder links)",
        ],
      },
    },
    displayTargets: {
      heading: "Display targets",
      inPanes: {
        name: "Display navigation header in panes",
        desc: `Show navigation header when notes are opened in panes.
This setting applies to note containers (panes). To show the navigation header,
also enable view-specific options below.`,
      },
      inPagePreviews: {
        name: "Display navigation header in page previews",
        desc: `Show navigation header when notes are shown in page previews.
This setting applies to note containers (page previews).
To show the navigation header, also enable view-specific options below.`,
      },
      inMarkdownViews: {
        name: "Display navigation header in Markdown views",
        desc: "Show navigation header when viewing Markdown documents.",
      },
      inImageViews: {
        name: "Display navigation header in Image views",
        desc: "Show navigation header when viewing images.",
      },
      inVideoViews: {
        name: "Display navigation header in Video views",
        desc: "Show navigation header when viewing videos.",
      },
      inAudioViews: {
        name: "Display navigation header in Audio views",
        desc: "Show navigation header when viewing audio.",
      },
      inPdfViews: {
        name: "Display navigation header in PDF views",
        desc: "Show navigation header when viewing PDFs.",
      },
      inCanvasViews: {
        name: "Display navigation header in Canvas views",
        desc: "Show navigation header when viewing Canvas.",
      },
      inBasesViews: {
        name: "Display navigation header in Bases views",
        desc: "Show navigation header when viewing Bases.",
      },
      inOtherViews: {
        name: "Display navigation header in other views",
        desc: `Show navigation header in other views (such as views introduced by community plugins).
This may not work depending on the view type.`,
      },
    },
    annotatedLinks: {
      heading: "Annotated links",
      annotationStringsForBacklinks: {
        name: "Annotation strings for backlinks",
        desc: `Define the annotation strings.
If one of the annotation strings (e.g., emojis) is placed immediately before
a link in a note content, the link is recognized as an annotated link.
Notes with annotated links appear as backlinks in the navigation header of the
destination note. Any string, including emoji, is acceptable as long as the following
link is recognized as a link (Wikilink or Markdown link).
To specify multiple annotations, separate them with commas. e.g., 📌,🔗.
{emojiPlaceholder} can be used as a special placeholder
that represents any single emoji. For example, if you specify only
{emojiPlaceholder}, all links preceded by an emoji will be matched.
It can also be mixed with other entries, e.g., {emojiPlaceholder}📌,🔗.
Leave this field blank if you are not using this feature.`,
      },
      annotationStringsForCurrentNote: {
        name: "Annotation strings for current note",
        desc: `Define the annotation strings for links in the current note.
This setting works the same way as "Annotation strings for backlinks",
but applies to links in the current note.`,
      },
      hidePrefixes: {
        name: "Hide prefixes in the navigation header",
        desc: "If enabled, prefixes (e.g., emojis) will be hidden in the navigation header.",
      },
      advancedAnnotationStringsForBacklinks: {
        name: "Advanced annotation strings for backlinks",
        desc: `An advanced version of "Annotation strings for backlinks".
This setting allows regular expressions to be used as
annotation strings and any prefix (e.g., an emoji) to be assigned for display
in the navigation header.
Enter one mapping per line using the format regex:prefix.
To include a colon in the prefix, escape it as "\\:".
An empty string is also acceptable as a prefix.`,
        placeholder: "📌:🔗\n(?:^|\\n)-:\n\\[\\[E\\]\\]:🔗",
      },
      advancedAnnotationStringsForCurrentNote: {
        name: "Advanced annotation strings for current note",
        desc: `An advanced version of "Annotation strings for current note".
The syntax is the same as that of "Advanced annotation strings for backlinks".`,
      },
      allowSpaceAfterAnnotationString: {
        name: "Allow a space between the annotation string and the link",
        desc: `If enabled, a link will still be recognized as an annotated link even if there is a
space between the annotation string and the link.`,
      },
      ignoreVariationSelectors: {
        name: "Ignore variation selectors",
        desc: "If enabled, emoji variation selectors (VS15/VS16) are ignored when matching links.",
      },
    },
    propertyLinks: {
      heading: "Property links",
      propertyMappings: {
        name: "Property mappings",
        desc: `Define the property mappings.
If the file property specified here points to a specific note,
that note will be displayed in the navigation header
(URLs to the website are also supported).
Each mapping consists of a property name and a string that will
be placed at the beginning of the link when it appears in the navigation header
(use emojis in this string if you want it to appear like an icon).
Each line should be in the format property_name:prefix.
To include a colon in the prefix, escape it as \\:. 
An empty string is also acceptable as a prefix.
Leave this field blank if you are not using this feature.`,
        placeholder: "up:⬆️\nhome:🏠",
      },
      previousNotePropertyMappings: {
        name: "Previous note property mappings",
        desc: `Enter the mapping that specifies the previous note. The note specified here will
appear in the navigation header as < previous | parent | next >.
The syntax is the same as "Property mappings".`,
        placeholder: "previous:",
      },
      nextNotePropertyMappings: {
        name: "Next note property mappings",
        desc: `Enter the mapping that specifies the next note. The note specified here will appear
in the navigation header as < previous | parent | next >.
The syntax is the same as "Property mappings".`,
        placeholder: "next:",
      },
      parentNotePropertyMappings: {
        name: "Parent note property mappings",
        desc: `Enter the mapping that specifies the parent note. The note specified here will appear
in the navigation header as < previous | parent | next >.
The syntax is the same as "Property mappings".`,
        placeholder: "parent:\nup:",
      },
      linkDisplayStyle: {
        name: "Link display style",
        desc: `Specify the display style of prev/next/parent links in the navigation header.
Full: < previous | parent | next >,
Full (double separator): < previous || parent || next >,
Separator: previous | parent | next,
Double separator: previous || parent || next,
None: previous parent next.`,
      },
      implicitReciprocalPropertyPairs: {
        name: "Implicit reciprocal property pairs",
        desc: `Specify pairs of property names here to implicitly create reciprocal links
in the navigation header. For example, if you enter prev:next here,
when Note A has a property "next: [[Note B]]", Note B will be treated as if
it also had "prev: [[Note A]]" even if it isn't explicitly set.
Enter one pair per line.`,
        placeholder: "prev:next\nparent:child",
      },
    },
    periodicNotes: {
      heading: "Periodic note links",
      displayPrevNextInDailyNotes: {
        name: "Display previous and next links in daily notes",
        desc: `To use this option, daily notes must be enabled
in Daily Notes plugin or Periodic Notes plugin.`,
      },
      parentForDailyNotes: { name: "Parent for daily notes" },
      displayPrevNextInWeeklyNotes: {
        name: "Display previous and next links in weekly notes",
        desc: "To use this option, weekly notes must be enabled in Periodic Notes plugin.",
      },
      parentForWeeklyNotes: { name: "Parent for weekly notes" },
      displayPrevNextInMonthlyNotes: {
        name: "Display previous and next links in monthly notes",
        desc: "To use this option, monthly notes must be enabled in Periodic Notes plugin.",
      },
      parentForMonthlyNotes: { name: "Parent for monthly notes" },
      displayPrevNextInQuarterlyNotes: {
        name: "Display previous and next links in quarterly notes",
        desc: "To use this option, quarterly notes must be enabled in Periodic Notes plugin.",
      },
      parentForQuarterlyNotes: { name: "Parent for quarterly notes" },
      displayPrevNextInYearlyNotes: {
        name: "Display previous and next links in yearly notes",
        desc: "To use this option, yearly notes must be enabled in Periodic Notes plugin.",
      },
      linkDisplayStyle: {
        name: "Link display style",
        desc: `Specify the display style of links in the navigation header.
Full: < previous | parent | next >,
Full (double separator): < previous || parent || next >,
Separator: previous | parent | next,
Double separator: previous || parent || next,
None: previous parent next.`,
      },
      linkPrefix: {
        name: "Link prefix",
        desc: "The string to display before each link (e.g., an emoji).",
      },
      granularityOptions: {
        none: "None",
        week: "Weekly",
        month: "Monthly",
        quarter: "Quarterly",
        year: "Yearly",
      },
    },
    pinnedContent: {
      heading: "Pinned note content",
      annotationStrings: {
        name: "Annotation strings",
        desc: `Display part of the current note in the navigation header.
The text shown starts immediately after the specified annotation string and
continues up to the end of the line.
If the start and end markers defined below appear immediately after
the annotation string, only the content between those markers is displayed instead.
Example: 📌[[note 1]]/[[note 2]](end of line) → 📌[[note 1]]/[[note 2]],
📌([[note 1]]/[[note 2]])[[note 3]] → 📌[[note 1]]/[[note 2]].
To specify multiple annotations, separate them with commas.`,
        placeholder: "📌,🔗",
      },
      startMarker: { name: "Start marker", placeholder: "(" },
      endMarker: { name: "End marker", placeholder: ")" },
      ignoreCodeBlocks: {
        name: "Ignore code blocks",
        desc: "If enabled, code blocks will be ignored when searching for pinned content.",
      },
    },
    folderLinks: {
      heading: "Folder links",
      folderSettingHeading: (index: number) => `Folder setting #${index}`,
      folderPaths: {
        name: "Folder paths",
        desc: `For each folder specified here, files in the same folder as the currently opened
file will be shown in the navigation header. Multiple folders can be specified
(enter one path per line). Glob patterns are supported
(e.g., **: all folders; *: all folders directly under root;
folder/*: all folders directly under "folder").`,
        placeholder: "path/to/the/folder\nanother/folder/*",
      },
      excludedFolderPaths: {
        name: "Excluded folder paths",
        desc: `Specify the folder paths to exclude. Multiple folders can be specified
(enter one path per line). Glob patterns are supported.`,
        placeholder: "path/to/the/folder\nanother/folder/*",
      },
      recursive: {
        name: "Recursive",
        desc: "Whether to include files in subfolders.",
      },
      includePatterns: {
        name: "Include patterns",
        desc: `Include files that match these patterns partially. Enter one per line.
Leave empty for all files.`,
        placeholder: "Chapter\n.pdf",
      },
      excludePatterns: {
        name: "Exclude patterns",
        desc: "Exclude files that match these patterns partially. Enter one per line.",
        placeholder: ".canvas",
      },
      enableRegex: {
        name: "Enable regular expressions",
        desc: "Whether to enable regular expressions for include/exclude patterns.",
      },
      filterBy: {
        name: "Filter by",
        desc: "Specify whether to use file names or property values for include/exclude patterns.",
        options: {
          filename: "File name",
          property: "Property",
        },
      },
      propertyNameToFilterBy: {
        name: "Property name to filter by",
        desc: `The name of the property to filter by.
This is required when "Filter by" is set to "Property".`,
      },
      sortOrder: {
        name: "Sort order",
        options: {
          asc: "Ascending",
          desc: "Descending",
        },
      },
      sortBy: {
        name: "Sort by",
        options: {
          filename: "File name",
          created: "Creation date",
          modified: "Modification date",
          property: "Property",
        },
      },
      propertyNameToSortBy: {
        name: "Property name to sort by",
        desc: `The name of the property to sort by.
This is required when "Sort by" is set to "Property".`,
      },
      maxLinks: {
        name: "Max links",
        desc: `The maximum number of folder links to display.
For example, if set to 3, the display would look like
<prev3 prev2 prev1 | parent | next1 next2 next3>.`,
      },
      pathToParentNote: {
        name: "Path to the parent note",
        placeholder: "path/to/the/note.md",
      },
      linkDisplayStyle: {
        name: "Link display style",
        desc: `Specify the display style of prev/next/parent links in the navigation header.
Full: < previous | parent | next >,
Full (double separator): < previous || parent || next >,
Separator: previous | parent | next,
Double separator: previous || parent || next,
None: previous parent next.`,
      },
      linkPrefix: {
        name: "Link prefix",
        desc: "The string to display before each link (e.g., an emoji).",
      },
      controls: {
        moveUp: "Move up",
        moveDown: "Move down",
        remove: "Remove",
        addFolderSetting: "Add folder setting",
      },
    },
  },
  command: {
    openPreviousPropertyLink: "Open previous property link",
    openNextPropertyLink: "Open next property link",
    openParentPropertyLink: "Open parent property link",
    openPreviousPeriodicNote: "Open previous periodic note",
    openNextPeriodicNote: "Open next periodic note",
    openParentPeriodicNote: "Open parent periodic note",
    openPreviousFolderLink: "Open previous folder link",
    openNextFolderLink: "Open next folder link",
    openParentFolderLink: "Open parent folder link",
    openPreviousAny: "Open previous link (for any type)",
    openNextAny: "Open next link (for any type)",
    openParentAny: "Open parent link (for any type)",
    toggleMatchNavigationWidth: 'Toggle "Match navigation width to line length"',
  },
  modal: {
    createNewNote: "Create a new note",
    fileNotExist: (fileTitle: string) =>
      `File "${fileTitle}" does not exist. Are you sure you want to create a new note?`,
    create: "Create",
    createDontAskAgain: "Create (Don't ask again)",
    cancel: "Cancel",
  },
  ui: {
    loading: "Loading...",
    noLinks: "No links",
    collapsedCount: (itemCount: number) =>
      `(${itemCount} ${itemCount === 1 ? "item" : "items"})`,
  },
};

export default en;
