import { Component, type TFile } from "obsidian";
import { mount, unmount } from "svelte";
import type NavLinkHeader from "./main";
import {
  NavigationLinkState,
  PrefixedLinkState,
  ThreeWayLinkState,
  PinnedNoteContentState,
  type LinkEventHandler,
} from "./ui/states";
import { ItemStatesContainer } from "./itemStatesContainer";
import { AnnotatedLinksManager } from "./annotatedLink";
import { getPropertyLinks, getThreeWayPropertyLink } from "./propertyLink";
import { createPeriodicNote, PeriodicNotesManager } from "./periodicNotes";
import { getPinnedNoteContents } from "./pinnedNoteContent";
import { FolderLinksManager } from "./folderLink";
import { FileCreationModal } from "./fileCreationModal";
import Navigation from "./ui/Navigation.svelte";
import {
  getStringValuesFromFileProperty,
  getFileStemFromPath,
  openExternalLink,
  PluginError,
} from "./utils";

/**
 * Navigation component to add the navigation links to.
 */
export class NavigationComponent extends Component {
  private navigation?: ReturnType<typeof Navigation>;

  private navigationProps: {
    items: (PrefixedLinkState | ThreeWayLinkState | PinnedNoteContentState)[];
    isLoading: boolean;
    matchWidthToLineLength: boolean;
    displayLoadingMessage: boolean;
    displayPlaceholder: boolean;
  } = $state({
    items: [],
    isLoading: false,
    matchWidthToLineLength: false,
    displayLoadingMessage: false,
    displayPlaceholder: false,
  });

  private currentFilePath?: string;

  private loaded: boolean = false;

  /**
   * Creates a new navigation component.
   * @param plugin The plugin instance.
   * @param containerEl The container element to add the navigation links.
   */
  constructor(private plugin: NavLinkHeader, private containerEl: Element) {
    super();
  }

  /**
   * Initializes the navigation component.
   */
  public onload(): void {
    this.navigationProps.items = [];
    this.navigationProps.isLoading = false;
    this.navigationProps.matchWidthToLineLength = false;
    this.navigationProps.displayLoadingMessage = false;
    this.navigationProps.displayPlaceholder = false;
    this.navigation = mount(Navigation, {
      target: this.containerEl,
      props: this.navigationProps,
    });
    this.loaded = true;
  }

  /**
   * Updates the navigation component with the specified file.
   * @param file The file object currently opened in the parent component.
   * @param forced If `true`, the navigation component is always updated.
   *     If `false`, the navigation component will not be updated if the file path
   *     has not changed since the last update.
   */
  public async update(file: TFile, forced: boolean): Promise<void> {
    if (!this.loaded) {
      return;
    }

    if (!forced && this.currentFilePath === file.path) {
      return;
    }
    this.currentFilePath = file.path;

    this.navigationProps.isLoading = true;
    this.navigationProps.matchWidthToLineLength =
      this.plugin.settings.matchNavigationWidthToLineLength;
    this.navigationProps.displayLoadingMessage = this.plugin.settings.displayLoadingMessage;
    this.navigationProps.displayPlaceholder = this.plugin.settings.displayPlaceholder;

    const filePath = file.path;
    const itemStatesContainer = new ItemStatesContainer(this.plugin);
    const clickHandler: LinkEventHandler = (target, e) => {
      if (target.isExternal) {
        void openExternalLink(this.plugin.app, target.destination, true);
      } else {
        void this.plugin.app.workspace.openLinkText(
          target.destination,
          filePath,
          e.ctrlKey || e.button === 1
        );
      }
    };
    const mouseOverHandler: LinkEventHandler = (target, e) => {
      if (!target.isExternal) {
        this.plugin.app.workspace.trigger("hover-link", {
          event: e,
          source: "nav-link-header",
          hoverParent: this,
          targetEl: e.target,
          linktext: target.destination,
          sourcePath: filePath,
        });
      }
    };

    this.constructPropertyLinkStates(file, clickHandler, mouseOverHandler).forEach((link) => {
      itemStatesContainer.addItem(link);
    });

    const threeWayPropertyLinkState = this.constructThreeWayPropertyLinkState(
      file,
      clickHandler,
      mouseOverHandler
    );
    if (threeWayPropertyLinkState) {
      itemStatesContainer.addItem(threeWayPropertyLinkState);
    }

    const periodicNoteLinkState = this.constructPeriodicNoteLinkState(
      file,
      clickHandler,
      mouseOverHandler
    );
    if (periodicNoteLinkState) {
      itemStatesContainer.addItem(periodicNoteLinkState);
    }

    this.constructFolderLinkStates(file, clickHandler, mouseOverHandler).forEach((link) => {
      itemStatesContainer.addItem(link);
    });

    // Update links that can always be constructed synchronously.
    this.navigationProps.items = [...itemStatesContainer.getItems()];

    const pinnedNoteContentStates = await this.constructPinnedNoteContentStates(
      file,
      clickHandler,
      mouseOverHandler
    );
    if (!this.loaded) {
      return;
    }
    if (pinnedNoteContentStates.length > 0) {
      pinnedNoteContentStates.forEach((link) => {
        itemStatesContainer.addItem(link);
      });
      this.navigationProps.items = [...itemStatesContainer.getItems()];
    }

    try {
      const generator = this.constructAnnotatedLinkStates(file, clickHandler, mouseOverHandler);
      for await (const link of generator) {
        if (!this.loaded) {
          return;
        }
        itemStatesContainer.addItem(link);
        this.navigationProps.items = [...itemStatesContainer.getItems()];
      }
    } catch (e) {
      if (e instanceof PluginError) {
        // Exit if the PeriodicNotesManager has been reset.
        return;
      }
    }

    this.navigationProps.isLoading = false;
  }

  /**
   * Unloads the navigation component
   */
  public onunload(): void {
    if (this.navigation) {
      void unmount(this.navigation);
      this.navigation = undefined;
    }
    this.currentFilePath = undefined;
    this.loaded = false;
  }

  /**
   * Constructs the property link states for the specified file.
   * @param file The file to construct the property link states for.
   * @param clickHandler The click handler for the links.
   * @param mouseOverHandler The mouse over handler for the links.
   * @returns The property link states.
   */
  private constructPropertyLinkStates(
    file: TFile,
    clickHandler: LinkEventHandler,
    mouseOverHandler: LinkEventHandler
  ): PrefixedLinkState[] {
    const result: PrefixedLinkState[] = [];

    if (this.plugin.settings.propertyMappings.length === 0) {
      return result;
    }

    const propertyLinks = getPropertyLinks(this.plugin, file);
    for (const link of propertyLinks) {
      result.push(
        new PrefixedLinkState({
          prefix: link.prefix,
          link: new NavigationLinkState({
            destination: link.destination,
            isExternal: link.isExternal,
            displayText: this.getDisplayText(link.destination, link.isExternal, link.displayText),
            resolved: true,
            clickHandler,
            mouseOverHandler,
          }),
        })
      );
    }

    return result;
  }

  /**
   * Constructs the three-way property link state for the specified file.
   * @param file The file to construct the three-way property link states for.
   * @param clickHandler The click handler for the links.
   * @param mouseOverHandler The mouse over handler for the links.
   * @returns The three-way property link state.
   */
  private constructThreeWayPropertyLinkState(
    file: TFile,
    clickHandler: LinkEventHandler,
    mouseOverHandler: LinkEventHandler
  ): ThreeWayLinkState | undefined {
    if (
      this.plugin.settings.previousLinkPropertyMappings.length === 0 &&
      this.plugin.settings.nextLinkPropertyMappings.length === 0 &&
      this.plugin.settings.parentLinkPropertyMappings.length === 0
    ) {
      return undefined;
    }

    const threeWayPropertyLink = getThreeWayPropertyLink(this.plugin, file);
    if (
      threeWayPropertyLink.previous.length === 0 &&
      threeWayPropertyLink.next.length === 0 &&
      threeWayPropertyLink.parent.length === 0
    ) {
      return undefined;
    }

    const previous: {
      links: PrefixedLinkState[];
      hidden: boolean;
    } = { links: [], hidden: true };
    const next: {
      links: PrefixedLinkState[];
      hidden: boolean;
    } = { links: [], hidden: true };
    const parent: {
      links: PrefixedLinkState[];
      hidden: boolean;
    } = { links: [], hidden: true };

    if (this.plugin.settings.previousLinkPropertyMappings.length > 0) {
      previous.hidden = false;
      previous.links = threeWayPropertyLink.previous.map((link) => {
        return new PrefixedLinkState({
          prefix: link.prefix,
          link: new NavigationLinkState({
            destination: link.destination,
            isExternal: link.isExternal,
            displayText: this.getDisplayText(link.destination, link.isExternal, link.displayText),
            resolved: true,
            clickHandler,
            mouseOverHandler,
          }),
        });
      });
    }

    if (this.plugin.settings.nextLinkPropertyMappings.length > 0) {
      next.hidden = false;
      next.links = threeWayPropertyLink.next.map((link) => {
        return new PrefixedLinkState({
          prefix: link.prefix,
          link: new NavigationLinkState({
            destination: link.destination,
            isExternal: link.isExternal,
            displayText: this.getDisplayText(link.destination, link.isExternal, link.displayText),
            resolved: true,
            clickHandler,
            mouseOverHandler,
          }),
        });
      });
    }

    if (this.plugin.settings.parentLinkPropertyMappings.length > 0) {
      parent.hidden = false;
      parent.links = threeWayPropertyLink.parent.map((link) => {
        return new PrefixedLinkState({
          prefix: link.prefix,
          link: new NavigationLinkState({
            destination: link.destination,
            isExternal: link.isExternal,
            displayText: this.getDisplayText(link.destination, link.isExternal, link.displayText),
            resolved: true,
            clickHandler,
            mouseOverHandler,
          }),
        });
      });
    }

    return new ThreeWayLinkState({
      type: "property",
      previous: previous,
      next: next,
      parent: parent,
    });
  }

  /**
   * Constructs the periodic note link state for the specified file.
   * @param file The file to construct the periodic note link states for.
   * @param clickHandler The default click handler for the links.
   * @param mouseOverHandler The default mouse over handler for the links.
   * @returns The periodic note link state.
   */
  private constructPeriodicNoteLinkState(
    file: TFile,
    clickHandler: LinkEventHandler,
    mouseOverHandler: LinkEventHandler
  ): ThreeWayLinkState | undefined {
    const periodicNotesManager = this.plugin.findComponent(PeriodicNotesManager)!;
    periodicNotesManager.syncActiveState();
    if (!periodicNotesManager.isActive) {
      return undefined;
    }

    const periodicNoteLinks = periodicNotesManager.searchAdjacentNotes(file);
    if (!periodicNoteLinks.currentGranularity) {
      return undefined;
    }

    const previous: {
      links: PrefixedLinkState[];
      hidden: boolean;
    } = { links: [], hidden: true };
    const next: {
      links: PrefixedLinkState[];
      hidden: boolean;
    } = { links: [], hidden: true };
    const parent: {
      links: PrefixedLinkState[];
      hidden: boolean;
    } = { links: [], hidden: true };

    // Previous and next links
    if (periodicNotesManager.isPrevNextLinkEnabled(periodicNoteLinks.currentGranularity)) {
      previous.hidden = false;
      next.hidden = false;

      if (periodicNoteLinks.previousPath) {
        previous.links.push(
          new PrefixedLinkState({
            prefix: "",
            link: new NavigationLinkState({
              destination: periodicNoteLinks.previousPath,
              isExternal: false,
              displayText: this.getDisplayText(periodicNoteLinks.previousPath, false),
              resolved: true,
              clickHandler,
              mouseOverHandler,
            }),
          })
        );
      }
      if (periodicNoteLinks.nextPath) {
        next.links.push(
          new PrefixedLinkState({
            prefix: "",
            link: new NavigationLinkState({
              destination: periodicNoteLinks.nextPath,
              isExternal: false,
              displayText: this.getDisplayText(periodicNoteLinks.nextPath, false),
              resolved: true,
              clickHandler,
              mouseOverHandler,
            }),
          })
        );
      }
    }

    // Parent link
    const parentGranularity = periodicNotesManager.getParentLinkGranularity(
      periodicNoteLinks.currentGranularity
    );
    if (parentGranularity) {
      parent.hidden = false;

      if (periodicNoteLinks.parentPath) {
        if (!periodicNoteLinks.parentDate) {
          parent.links.push(
            new PrefixedLinkState({
              prefix: "",
              link: new NavigationLinkState({
                destination: periodicNoteLinks.parentPath,
                isExternal: false,
                displayText: this.getDisplayText(periodicNoteLinks.parentPath, false),
                resolved: true,
                clickHandler,
                mouseOverHandler,
              }),
            })
          );
        } else {
          // Make unresolved link.
          const clickHandlerForUnresolvedLinks: LinkEventHandler = (target, e) => {
            if (this.plugin.settings.confirmFileCreation) {
              new FileCreationModal(this.plugin, getFileStemFromPath(target.destination), () => {
                void createPeriodicNote(
                  periodicNoteLinks.parentGranularity!,
                  periodicNoteLinks.parentDate!
                );
              }).open();
            } else {
              void createPeriodicNote(
                periodicNoteLinks.parentGranularity!,
                periodicNoteLinks.parentDate!
              );
            }
          };
          parent.links.push(
            new PrefixedLinkState({
              prefix: "",
              link: new NavigationLinkState({
                destination: periodicNoteLinks.parentPath,
                isExternal: false,
                displayText: getFileStemFromPath(periodicNoteLinks.parentPath),
                resolved: false,
                clickHandler: clickHandlerForUnresolvedLinks,
                mouseOverHandler: () => {},
              }),
            })
          );
        }
      }
    }

    if (previous.hidden && next.hidden && parent.hidden) {
      return undefined;
    }

    return new ThreeWayLinkState({
      type: "periodic",
      previous: previous,
      next: next,
      parent: parent,
    });
  }

  /**
   * Constructs the folder link states for the specified file.
   * @param file The file to construct the folder link states for.
   * @param clickHandler The click handler for the links.
   * @param mouseOverHandler The mouse over handler for the links.
   * @returns The folder link states.
   */
  private constructFolderLinkStates(
    file: TFile,
    clickHandler: LinkEventHandler,
    mouseOverHandler: LinkEventHandler
  ): ThreeWayLinkState[] {
    const result: ThreeWayLinkState[] = [];

    const folderLinksManager = this.plugin.findComponent(FolderLinksManager)!;
    if (!folderLinksManager.isActive) {
      return result;
    }

    for (const adjacentFiles of folderLinksManager.getAdjacentFiles(file)) {
      const settings = this.plugin.settings.folderLinksSettingsArray[adjacentFiles.index];

      const previous: {
        links: PrefixedLinkState[];
        hidden: boolean;
      } = { links: [], hidden: false };
      const next: {
        links: PrefixedLinkState[];
        hidden: boolean;
      } = { links: [], hidden: false };
      const parent: {
        links: PrefixedLinkState[];
        hidden: boolean;
      } = { links: [], hidden: true };

      previous.links = adjacentFiles.previous.map((path) => {
        return new PrefixedLinkState({
          prefix: settings.linkPrefix,
          link: new NavigationLinkState({
            destination: path,
            isExternal: false,
            displayText: this.getDisplayText(path, false),
            resolved: true,
            clickHandler,
            mouseOverHandler,
          }),
        });
      });

      next.links = adjacentFiles.next.map((path) => {
        return new PrefixedLinkState({
          prefix: settings.linkPrefix,
          link: new NavigationLinkState({
            destination: path,
            isExternal: false,
            displayText: this.getDisplayText(path, false),
            resolved: true,
            clickHandler,
            mouseOverHandler,
          }),
        });
      });

      if (this.plugin.settings.folderLinksSettingsArray[adjacentFiles.index].parentPath) {
        parent.hidden = false;
        if (adjacentFiles.parent.length > 0) {
          parent.links = adjacentFiles.parent.map((path) => {
            return new PrefixedLinkState({
              prefix: settings.linkPrefix,
              link: new NavigationLinkState({
                destination: path,
                isExternal: false,
                displayText: this.getDisplayText(path, false),
                resolved: true,
                clickHandler,
                mouseOverHandler,
              }),
            });
          });
        }
      }

      result.push(
        new ThreeWayLinkState({
          type: "folder",
          index: adjacentFiles.index,
          previous: previous,
          next: next,
          parent: parent,
          delimiters: settings.displayStyle,
        })
      );
    }

    return result;
  }

  /**
   * Constructs the pinned note content states for the specified file.
   * @param file The file to construct the pinned note content states for.
   * @param clickHandler The click handler for the links.
   * @param mouseOverHandler The mouse over handler for the links.
   * @returns The pinned note content states.
   */
  private async constructPinnedNoteContentStates(
    file: TFile,
    clickHandler: LinkEventHandler,
    mouseOverHandler: LinkEventHandler
  ): Promise<PinnedNoteContentState[]> {
    if (this.plugin.settings.annotationStringsForPinning.length === 0) {
      return [];
    }

    return (await getPinnedNoteContents(this.plugin, file)).map((pinnedNoteContent) => {
      return new PinnedNoteContentState({
        prefix: pinnedNoteContent.prefix,
        content: pinnedNoteContent.content.map((item) => {
          if (typeof item === "string") {
            return item;
          } else {
            return new NavigationLinkState({
              destination: item.destination,
              isExternal: item.isExternal,
              displayText: this.getDisplayText(
                item.destination,
                item.isExternal,
                item.displayText,
                false
              ),
              resolved: true,
              clickHandler,
              mouseOverHandler,
            });
          }
        }),
      });
    });
  }

  /**
   * Constructs the annotated link states for the specified file.
   * @param file The file to construct the annotated link states for.
   * @param clickHandler The click handler for the links.
   * @param mouseOverHandler The mouse over handler for the links.
   * @returns The annotated link states.
   * @throws {PluginError} Throws when the `AnnotatedLinksManager` has been reset
   *     during async operation.
   */
  private async *constructAnnotatedLinkStates(
    file: TFile,
    clickHandler: LinkEventHandler,
    mouseOverHandler: LinkEventHandler
  ): AsyncGenerator<PrefixedLinkState> {
    const annotatedLinksManager = this.plugin.findComponent(AnnotatedLinksManager)!;
    if (!annotatedLinksManager.isActive) {
      return;
    }

    const generator = annotatedLinksManager.searchAnnotatedLinks(file);
    for await (const link of generator) {
      yield new PrefixedLinkState({
        prefix: link.prefix,
        link: new NavigationLinkState({
          destination: link.destinationPath,
          isExternal: false,
          displayText: this.getDisplayText(link.destinationPath, false),
          resolved: true,
          clickHandler,
          mouseOverHandler,
        }),
      });
    }
  }

  /**
   * Gets the display text for the specified destination.
   * The return value is determined based on the following order of priority:
   * 1. `manualDisplayText` (if specified).
   * 2. The destination URL (if `isExternal` is `true`).
   * 3. The specified property value of destination file
   *    (if `propertyNameForDisplayText` is specified in settings).
   * 4. The title of the destination path.
   * @param destination The destination (file path or URL).
   * @param isExternal Whether the destination is an external link.
   * @param manualDisplayText The manual display text (e.g., from `[[path|display]]`).
   * @param usePropertyValue If `false`, the property value is not used even if
   *     specified in settings.
   * @returns The display text.
   */
  private getDisplayText(
    destination: string,
    isExternal: boolean,
    manualDisplayText?: string,
    usePropertyValue: boolean = true
  ): string {
    if (manualDisplayText) {
      return manualDisplayText;
    }

    if (isExternal) {
      return destination;
    }

    if (usePropertyValue) {
      const propertyName = this.plugin.settings.propertyNameForDisplayText;
      if (propertyName) {
        const linkedFile = this.plugin.app.vault.getFileByPath(destination);
        if (linkedFile) {
          const values = getStringValuesFromFileProperty(this.plugin.app, linkedFile, propertyName);
          if (values.length > 0) {
            return values[0];
          }
        }
      }
    }

    return getFileStemFromPath(destination);
  }
}
