import { Component, type TFile } from "obsidian";
import { mount, unmount } from "svelte";
import type NavLinkHeader from "./main";
import {
  NavigationLinkState,
  PrefixedLinkState,
  ThreeWayLinkState,
  type LinkEventHandler,
} from "./navigationLinkState";
import { LinkContainer } from "./linkContainer";
import { getPropertyLinks, getThreeWayPropertyLink } from "./propertyLink";
import {
  createPeriodicNote,
  getParentLinkGranularitySetting,
  getPrevNextLinkEnabledSetting,
} from "./periodicNotes";
import { FileCreationModal } from "./fileCreationModal";
import { getStringValuesFromFileProperty, getTitleFromPath, openExternalLink } from "./utils";
import Navigation from "./ui/Navigation.svelte";

/**
 * Navigation component to add the navigation links to.
 */
export class NavigationComponent extends Component {
  private navigation?: ReturnType<typeof Navigation>;
  private navigationProps: {
    links: (PrefixedLinkState | ThreeWayLinkState)[];
    isLoading: boolean;
    displayPlaceholder: boolean;
  } = $state({
    links: [],
    isLoading: false,
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
    this.navigationProps.links = [];
    this.navigationProps.isLoading = false;
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
   * @param hoverParent The parent component to add the hover popover when
   *     the link in this component is hovered.
   * @param forced If `true`, the navigation component is always updated.
   *     If `false`, the navigation component will not be updated if the file path
   *     has not changed since the last update.
   */
  public async update(file: TFile, hoverParent: Component, forced: boolean): Promise<void> {
    if (!this.loaded) {
      return;
    }

    const fileChanged = this.currentFilePath !== file.path;
    this.currentFilePath = file.path;

    // Prevents unnecessary updates.
    if (!forced && !fileChanged) {
      return;
    }

    this.navigationProps.isLoading = true;
    this.navigationProps.displayPlaceholder = this.plugin.settings!.displayPlaceholder;

    const filePath = file.path;
    const newLinks = new LinkContainer(this.plugin);
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
          hoverParent,
          targetEl: e.target,
          linktext: target.destination,
          sourcePath: filePath,
        });
      }
    };

    // Property links
    if (this.plugin.settings!.propertyMappings.length > 0) {
      this.constructPropertyLinkStates(file, clickHandler, mouseOverHandler).forEach((link) => {
        newLinks.addLink(link);
      });
    }

    // Periodic note links
    if (this.plugin.periodicNotesEnabled) {
      const periodicNoteLinkState = this.constructPeriodicNoteLinkState(
        file,
        clickHandler,
        mouseOverHandler
      );
      if (periodicNoteLinkState) {
        newLinks.addLink(periodicNoteLinkState);
      }
    }

    // Three-way property links
    if (
      this.plugin.settings!.previousLinkProperty ||
      this.plugin.settings!.nextLinkProperty ||
      this.plugin.settings!.parentLinkProperty
    ) {
      const threeWayPropertyLink = this.constructThreeWayPropertyLinkState(
        file,
        clickHandler,
        mouseOverHandler
      );
      if (threeWayPropertyLink) {
        newLinks.addLink(threeWayPropertyLink);
      }
    }

    // Folder links
    if (this.plugin.settings!.folderLinksSettingsArray.length > 0) {
      this.constructFolderLinkStates(file, clickHandler, mouseOverHandler).forEach((link) => {
        newLinks.addLink(link);
      });
    }

    if (fileChanged) {
      // If the file has changed, update the navigation as soon as possible.
      this.navigationProps.links = [...newLinks.getLinks()];
    }

    // Annotated links
    if (this.plugin.settings!.annotationStrings.length > 0) {
      const generator = this.constructAnnotatedLinkStates(file, clickHandler, mouseOverHandler);
      for await (const link of generator) {
        if (!this.loaded) {
          return; // Handles the async gap.
        }
        newLinks.addLink(link);
        if (fileChanged) {
          // If the file has changed, update the navigation as soon as possible.
          this.navigationProps.links = [...newLinks.getLinks()];
        }
      }
    }

    if (!fileChanged) {
      // If the file has not changed, update the navigation after all links are added.
      // This is to prevent flickering.
      this.navigationProps.links = [...newLinks.getLinks()];
    }

    this.navigationProps.isLoading = false;
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
    const periodicNoteLinks = this.plugin.periodicNotesManager!.searchAdjacentNotes(file);
    if (!periodicNoteLinks.currentGranularity) {
      return undefined;
    }

    const previous: {
      link?: NavigationLinkState;
      hidden: boolean;
    } = { link: undefined, hidden: true };
    const next: {
      link?: NavigationLinkState;
      hidden: boolean;
    } = { link: undefined, hidden: true };
    const parent: {
      link?: NavigationLinkState;
      hidden: boolean;
    } = { link: undefined, hidden: true };

    // Previous and next links
    if (
      getPrevNextLinkEnabledSetting(this.plugin.settings!, periodicNoteLinks.currentGranularity)
    ) {
      previous.hidden = false;
      next.hidden = false;

      if (periodicNoteLinks.previousPath) {
        previous.link = new NavigationLinkState({
          destination: periodicNoteLinks.previousPath,
          isExternal: false,
          displayText: this.getDisplayText(periodicNoteLinks.previousPath, false),
          resolved: true,
          clickHandler,
          mouseOverHandler,
        });
      }
      if (periodicNoteLinks.nextPath) {
        next.link = new NavigationLinkState({
          destination: periodicNoteLinks.nextPath,
          isExternal: false,
          displayText: this.getDisplayText(periodicNoteLinks.nextPath, false),
          resolved: true,
          clickHandler,
          mouseOverHandler,
        });
      }
    }

    // Parent link
    const parentGranularity = getParentLinkGranularitySetting(
      this.plugin.settings!,
      periodicNoteLinks.currentGranularity
    );
    if (parentGranularity) {
      parent.hidden = false;

      if (periodicNoteLinks.parentPath) {
        if (!periodicNoteLinks.parentDate) {
          parent.link = new NavigationLinkState({
            destination: periodicNoteLinks.parentPath,
            isExternal: false,
            displayText: this.getDisplayText(periodicNoteLinks.parentPath, false),
            resolved: true,
            clickHandler,
            mouseOverHandler,
          });
        } else {
          // Make unresolved link.
          const clickHandlerForUnresolvedLinks: LinkEventHandler = (target, e) => {
            if (this.plugin.settings!.confirmFileCreation) {
              new FileCreationModal(this.plugin, getTitleFromPath(target.destination), () => {
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
          parent.link = new NavigationLinkState({
            destination: periodicNoteLinks.parentPath,
            isExternal: false,
            displayText: getTitleFromPath(periodicNoteLinks.parentPath),
            resolved: false,
            clickHandler: clickHandlerForUnresolvedLinks,
            mouseOverHandler: () => {},
          });
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
    const threeWayPropertyLink = getThreeWayPropertyLink(this.plugin, file);
    if (
      !threeWayPropertyLink.previous &&
      !threeWayPropertyLink.next &&
      !threeWayPropertyLink.parent
    ) {
      return undefined;
    }

    const previous: {
      link?: NavigationLinkState;
      hidden: boolean;
    } = { link: undefined, hidden: true };
    const next: {
      link?: NavigationLinkState;
      hidden: boolean;
    } = { link: undefined, hidden: true };
    const parent: {
      link?: NavigationLinkState;
      hidden: boolean;
    } = { link: undefined, hidden: true };

    if (this.plugin.settings!.previousLinkProperty) {
      previous.hidden = false;
      if (threeWayPropertyLink.previous) {
        previous.link = new NavigationLinkState({
          destination: threeWayPropertyLink.previous.destination,
          isExternal: threeWayPropertyLink.previous.isExternal,
          displayText: this.getDisplayText(
            threeWayPropertyLink.previous.destination,
            threeWayPropertyLink.previous.isExternal,
            threeWayPropertyLink.previous.displayText
          ),
          resolved: true,
          clickHandler,
          mouseOverHandler,
        });
      }
    }

    if (this.plugin.settings!.nextLinkProperty) {
      next.hidden = false;
      if (threeWayPropertyLink.next) {
        next.link = new NavigationLinkState({
          destination: threeWayPropertyLink.next.destination,
          isExternal: threeWayPropertyLink.next.isExternal,
          displayText: this.getDisplayText(
            threeWayPropertyLink.next.destination,
            threeWayPropertyLink.next.isExternal,
            threeWayPropertyLink.next.displayText
          ),
          resolved: true,
          clickHandler,
          mouseOverHandler,
        });
      }
    }

    if (this.plugin.settings!.parentLinkProperty) {
      parent.hidden = false;
      if (threeWayPropertyLink.parent) {
        parent.link = new NavigationLinkState({
          destination: threeWayPropertyLink.parent.destination,
          isExternal: threeWayPropertyLink.parent.isExternal,
          displayText: this.getDisplayText(
            threeWayPropertyLink.parent.destination,
            threeWayPropertyLink.parent.isExternal,
            threeWayPropertyLink.parent.displayText
          ),
          resolved: true,
          clickHandler,
          mouseOverHandler,
        });
      }
    }

    return new ThreeWayLinkState({
      type: "property",
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

    for (let i = 0; i < this.plugin.folderLinksManagers.length; i++) {
      const manager = this.plugin.folderLinksManagers[i];
      const files = manager.getAdjacentFiles(file);
      if (!files.currentFileIncluded) {
        continue;
      }

      const previous: {
        link?: NavigationLinkState;
        hidden: boolean;
      } = { link: undefined, hidden: false };
      const next: {
        link?: NavigationLinkState;
        hidden: boolean;
      } = { link: undefined, hidden: false };
      const parent: {
        link?: NavigationLinkState;
        hidden: boolean;
      } = { link: undefined, hidden: true };

      if (files.previous) {
        previous.link = new NavigationLinkState({
          destination: files.previous,
          isExternal: false,
          displayText: this.getDisplayText(files.previous, false),
          resolved: true,
          clickHandler,
          mouseOverHandler,
        });
      }

      if (files.next) {
        next.link = new NavigationLinkState({
          destination: files.next,
          isExternal: false,
          displayText: this.getDisplayText(files.next, false),
          resolved: true,
          clickHandler,
          mouseOverHandler,
        });
      }

      if (this.plugin.settings!.folderLinksSettingsArray[i].parentPath) {
        parent.hidden = false;
        if (files.parent) {
          parent.link = new NavigationLinkState({
            destination: files.parent,
            isExternal: false,
            displayText: this.getDisplayText(files.parent, false),
            resolved: true,
            clickHandler,
            mouseOverHandler,
          });
        }
      }

      result.push(
        new ThreeWayLinkState({
          type: "folder",
          index: i,
          previous: previous,
          next: next,
          parent: parent,
        })
      );
    }

    return result;
  }

  /**
   * Constructs the annotated link states for the specified file.
   * @param file The file to construct the annotated link states for.
   * @param clickHandler The click handler for the links.
   * @param mouseOverHandler The mouse over handler for the links.
   * @returns The annotated link states.
   */
  private async *constructAnnotatedLinkStates(
    file: TFile,
    clickHandler: LinkEventHandler,
    mouseOverHandler: LinkEventHandler
  ): AsyncGenerator<PrefixedLinkState> {
    const generator = this.plugin.annotatedLinksManager!.searchAnnotatedLinks(file);
    for await (const link of generator) {
      yield new PrefixedLinkState({
        prefix: link.annotation,
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
   * @returns The display text.
   */
  private getDisplayText(
    destination: string,
    isExternal: boolean,
    manualDisplayText?: string
  ): string {
    if (manualDisplayText) {
      return manualDisplayText;
    }

    if (isExternal) {
      return destination;
    }

    const propertyName = this.plugin.settings!.propertyNameForDisplayText;
    if (propertyName) {
      const linkedFile = this.plugin.app.vault.getFileByPath(destination);
      if (linkedFile) {
        const values = getStringValuesFromFileProperty(this.plugin.app, linkedFile, propertyName);
        if (values.length > 0) {
          return values[0];
        }
      }
    }

    return getTitleFromPath(destination);
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
}
