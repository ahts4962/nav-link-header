import type { ThreeWayDelimiters } from "../ui/props";

export interface BaseMessage {
  setting: {
    tabs: {
      common: string;
      enabledViews: string;
      annotatedLinks: string;
      propertyLinks: string;
      periodicNotes: string;
      pinnedContent: string;
      folderLinks: string;
    };
    sections: {
      display: string;
      displayPosition: string;
      enabledViews: string;
    };
    threeWayDelimiterOptions: Record<ThreeWayDelimiters, string>;
    general: {
      pluginGuide: { name: string; desc: string; linkLabel: string };
      matchNavigationWidthToLineLength: { name: string; desc: string };
      displayOrderOfLinks: { name: string; desc: string; descTooltip: string; tip: string };
      propertyNameForDisplayText: { name: string; desc: string; placeholder: string };
      filterDuplicateLinks: { name: string; desc: string };
      duplicateLinkFilteringPriority: { name: string; desc: string };
      itemCollapsePrefixes: { name: string; desc: string; tip: string };
      mergePrefixes: { name: string; desc: string; tip: string };
      displayLoadingMessage: { name: string; desc: string };
      displayPlaceholder: { name: string; desc: string };
      confirmFileCreation: { name: string; desc: string };
      trimWhitespaceInInputFields: {
        name: string;
        desc: string;
        descTooltip: string;
        affectedSettings: string[];
      };
    };
    displayTargets: {
      heading: string;
      inPanes: { name: string; desc: string; tip: string };
      inPagePreviews: { name: string; desc: string; tip: string };
      inMarkdownViews: { name: string; desc: string };
      inImageViews: { name: string; desc: string };
      inVideoViews: { name: string; desc: string };
      inAudioViews: { name: string; desc: string };
      inPdfViews: { name: string; desc: string };
      inCanvasViews: { name: string; desc: string };
      inBasesViews: { name: string; desc: string };
      inOtherViews: { name: string; desc: string };
    };
    annotatedLinks: {
      heading: string;
      annotationStringsForBacklinks: { name: string; desc: string; tip: string };
      annotationStringsForBacklinksTooltip: string;
      annotationStringsForCurrentNote: { name: string; desc: string };
      hidePrefixes: { name: string; desc: string };
      advancedAnnotationStringsForBacklinks: {
        name: string;
        desc: string;
        placeholder: string;
      };
      advancedAnnotationStringsForCurrentNote: { name: string; desc: string; tip: string };
      allowSpaceAfterAnnotationString: { name: string; desc: string };
      ignoreVariationSelectors: { name: string; desc: string };
    };
    propertyLinks: {
      heading: string;
      propertyMappings: { name: string; desc: string; tip: string; placeholder: string };
      previousNotePropertyMappings: {
        name: string;
        desc: string;
        tip: string;
        placeholder: string;
      };
      nextNotePropertyMappings: {
        name: string;
        desc: string;
        tip: string;
        placeholder: string;
      };
      parentNotePropertyMappings: {
        name: string;
        desc: string;
        tip: string;
        placeholder: string;
      };
      linkDisplayStyle: { name: string; desc: string };
      implicitReciprocalPropertyPairs: { name: string; desc: string; placeholder: string };
    };
    periodicNotes: {
      heading: string;
      sections: {
        daily: string;
        weekly: string;
        monthly: string;
        quarterly: string;
        yearly: string;
      };
      displayPrevNextInDailyNotes: { name: string; desc: string };
      parentForDailyNotes: { name: string };
      displayPrevNextInWeeklyNotes: { name: string; desc: string };
      parentForWeeklyNotes: { name: string };
      displayPrevNextInMonthlyNotes: { name: string; desc: string };
      parentForMonthlyNotes: { name: string };
      displayPrevNextInQuarterlyNotes: { name: string; desc: string };
      parentForQuarterlyNotes: { name: string };
      displayPrevNextInYearlyNotes: { name: string; desc: string };
      linkDisplayStyle: { name: string; desc: string };
      linkPrefix: { name: string; desc: string };
      granularityOptions: {
        none: string;
        week: string;
        month: string;
        quarter: string;
        year: string;
      };
    };
    pinnedContent: {
      heading: string;
      annotationStrings: { name: string; desc: string; tip: string; placeholder: string };
      startMarker: { name: string; placeholder: string };
      endMarker: { name: string; placeholder: string };
      ignoreCodeBlocks: { name: string; desc: string };
    };
    folderLinks: {
      heading: string;
      folderSettingHeading: (index: number) => string;
      folderPaths: { name: string; desc: string; placeholder: string };
      excludedFolderPaths: { name: string; desc: string; placeholder: string };
      recursive: { name: string; desc: string };
      includePatterns: { name: string; desc: string; placeholder: string };
      excludePatterns: { name: string; desc: string; placeholder: string };
      enableRegex: { name: string; desc: string };
      filterBy: {
        name: string;
        desc: string;
        options: { filename: string; property: string };
      };
      propertyNameToFilterBy: { name: string; desc: string };
      sortOrder: { name: string; options: { asc: string; desc: string } };
      sortBy: {
        name: string;
        options: { filename: string; created: string; modified: string; property: string };
      };
      propertyNameToSortBy: { name: string; desc: string };
      maxLinks: { name: string; desc: string };
      pathToParentNote: { name: string; placeholder: string };
      linkDisplayStyle: { name: string; desc: string };
      linkPrefix: { name: string; desc: string };
      controls: {
        rename: string;
        expand: string;
        collapse: string;
        pinToTop: string;
        moveUp: string;
        moveDown: string;
        remove: string;
        addFolderSetting: string;
      };
    };
  };
  command: {
    openPreviousPropertyLink: string;
    openNextPropertyLink: string;
    openParentPropertyLink: string;
    openPreviousPeriodicNote: string;
    openNextPeriodicNote: string;
    openParentPeriodicNote: string;
    openPreviousFolderLink: string;
    openNextFolderLink: string;
    openParentFolderLink: string;
    openPreviousAny: string;
    openNextAny: string;
    openParentAny: string;
    toggleMatchNavigationWidth: string;
  };
  modal: {
    createNewNote: string;
    fileNotExist: (fileTitle: string) => string;
    create: string;
    createDontAskAgain: string;
    cancel: string;
  };
  ui: {
    loading: string;
    noLinks: string;
    collapsedCount: (itemCount: number) => string;
  };
}
