import { type TFile, type HoverParent, HoverPopover } from "obsidian";
import { mount, unmount } from "svelte";
import type NavLinkHeader from "./main";
import type { LinkInfo, ThreeWayDirection } from "./types";
import type {
  LinkEventHandler,
  NavigationItemProps,
  NoteContentProps,
  PrefixedLinkProps,
  PrefixEventHandler,
  ThreeWayLinkProps,
} from "./ui/props";
import { ItemPropsContainer } from "./itemPropsContainer";
import { AnnotatedLinksManager } from "./annotatedLink";
import { getPropertyLinks, getThreeWayPropertyLink } from "./propertyLink";
import { createPeriodicNote, PeriodicNotesManager } from "./periodicNotes";
import { getPinnedNoteContents } from "./pinnedNoteContent";
import { FolderLinksManager } from "./folderLink";
import { FileCreationModal } from "./fileCreationModal";
import Navigation from "./ui/Navigation.svelte";
import { PluginError } from "./pluginError";
import { getFileStemFromPath, getStringValuesFromFileProperty, openExternalLink } from "./utils";

type EventHandlersForProps = {
  clickHandler: LinkEventHandler;
  mouseOverHandler: LinkEventHandler;
  prefixClickHandler: PrefixEventHandler;
};

/**
 * A class responsible for aggregating data and passing it to UI components.
 * Each instance corresponds to a single navigation header.
 */
export class NavigationController implements HoverParent {
  private navigation?: ReturnType<typeof Navigation>;

  private navigationProps: {
    items: NavigationItemProps[];
    isLoading: boolean;
    matchWidthToLineLength: boolean;
    displayLoadingMessage: boolean;
    displayPlaceholder: boolean;
    onHeightChange?: (height: number) => void;
  };

  public hoverPopover: HoverPopover | null = null;

  private filePath?: string; // The file path of the view to which the navigation header belongs.

  private disposed: boolean = false;

  /**
   * Creates a new `NavigationController`.
   * @param plugin The plugin instance.
   * @param containerEl The container element to add the navigation header.
   */
  constructor(
    private plugin: NavLinkHeader,
    private containerEl: Element,
  ) {
    this.navigationProps = $state({
      items: [],
      isLoading: false,
      matchWidthToLineLength: false,
      displayLoadingMessage: false,
      displayPlaceholder: false,
      onHeightChange: undefined,
    });

    this.navigation = mount(Navigation, {
      target: this.containerEl,
      props: this.navigationProps,
    });
  }

  /**
   * Updates the navigation header with the specified file.
   * @param file The file object to update the navigation header for.
   *     If `null`, uses the file from the last update.
   * @param forced If `true`, the navigation header is always updated.
   *     If `false`, the navigation header will not be updated if the file path
   *     has not changed since the last update.
   */
  public async update(file: TFile | null, forced: boolean): Promise<void> {
    if (this.disposed) {
      return;
    }

    if (file === null) {
      file = this.plugin.app.vault.getFileByPath(this.filePath ?? "");
      if (file === null) {
        return;
      }
    }
    if (!forced && this.filePath === file.path) {
      return;
    }
    this.filePath = file.path;

    this.navigationProps.isLoading = true;
    this.navigationProps.matchWidthToLineLength =
      this.plugin.settings.matchNavigationWidthToLineLength;
    this.navigationProps.displayLoadingMessage = this.plugin.settings.displayLoadingMessage;
    this.navigationProps.displayPlaceholder = this.plugin.settings.displayPlaceholder;

    // Set additional offset of markdown content for phone layout.
    this.navigationProps.onHeightChange = (height: number) => {
      const viewContent = this.containerEl.parentElement?.querySelector(
        ".is-phone .view-content:has(.markdown-source-view, .markdown-reading-view)",
      );
      if (viewContent instanceof HTMLElement) {
        viewContent.style.setProperty(
          "--nav-link-header-markdown-additional-offset",
          `${height}px`,
        );
      }
    };

    const filePath = this.filePath;
    const itemPropsContainer = new ItemPropsContainer(this.plugin);
    const defaultHandlers: EventHandlersForProps = {
      clickHandler: (target, e) => {
        if (target.linkInfo.isExternal) {
          void openExternalLink(this.plugin.app, target.linkInfo.destination, true);
        } else {
          void this.plugin.app.workspace.openLinkText(
            target.linkInfo.destination,
            filePath,
            e.ctrlKey || e.button === 1,
          );
        }
      },
      mouseOverHandler: (target, e) => {
        if (!target.linkInfo.isExternal) {
          this.plugin.app.workspace.trigger("hover-link", {
            event: e,
            source: "nav-link-header",
            hoverParent: this,
            targetEl: e.target,
            linktext: target.linkInfo.destination,
            sourcePath: filePath,
          });
        }
      },
      prefixClickHandler: (target) => {
        const label = target.label;
        if (!this.plugin.settingsUnderChange.itemCollapsePrefixes.includes(label)) {
          this.plugin.settingsUnderChange.itemCollapsePrefixes.push(label);
          this.plugin.triggerSettingsChanged();
        }
      },
    };

    this.constructPropertyLinkProps(file, defaultHandlers).forEach((props) => {
      itemPropsContainer.addItem(props);
    });

    const threeWayPropertyLinkProps = this.constructThreeWayPropertyLinkProps(
      file,
      defaultHandlers,
    );
    if (threeWayPropertyLinkProps) {
      itemPropsContainer.addItem(threeWayPropertyLinkProps);
    }

    const periodicNoteLinkProps = this.constructPeriodicNoteLinkProps(file, defaultHandlers);
    if (periodicNoteLinkProps) {
      itemPropsContainer.addItem(periodicNoteLinkProps);
    }

    this.constructFolderLinkProps(file, defaultHandlers).forEach((props) => {
      itemPropsContainer.addItem(props);
    });

    // Update props that can always be constructed synchronously.
    this.navigationProps.items = itemPropsContainer.getItems();

    const pinnedNoteContentProps = await this.constructPinnedNoteContentProps(
      file,
      defaultHandlers,
    );
    if (this.disposed) {
      return;
    }
    if (pinnedNoteContentProps.length > 0) {
      pinnedNoteContentProps.forEach((props) => {
        itemPropsContainer.addItem(props);
      });
      this.navigationProps.items = itemPropsContainer.getItems();
    }

    try {
      const generator = this.constructAnnotatedLinkProps(file, defaultHandlers);
      for await (const props of generator) {
        if (this.disposed) {
          return;
        }
        props.forEach((p) => itemPropsContainer.addItem(p));
        this.navigationProps.items = itemPropsContainer.getItems();
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
   * Unloads the navigation header and releases resources.
   */
  public dispose(): void {
    if (this.navigation) {
      void unmount(this.navigation).then(() => {
        const viewContent = this.containerEl.parentElement?.querySelector(".view-content");
        if (viewContent instanceof HTMLElement) {
          viewContent.style.removeProperty("--nav-link-header-markdown-additional-offset");
        }
      });
      this.navigation = undefined;
    }

    this.filePath = undefined;
    this.disposed = true;
  }

  /**
   * Constructs the property link props for the specified file.
   * @param file The file to construct the property link props for.
   * @returns The property link props.
   */
  private constructPropertyLinkProps(
    file: TFile,
    defaultHandlers: EventHandlersForProps,
  ): PrefixedLinkProps[] {
    if (this.plugin.settings.propertyMappings.length === 0) {
      return [];
    }

    return getPropertyLinks(this.plugin, file).map((link) => {
      return {
        type: "prefixed-link",
        prefix: { label: link.prefix, clickHandler: defaultHandlers.prefixClickHandler },
        link: {
          linkInfo: this.resolveDisplayText(link.link),
          clickHandler: defaultHandlers.clickHandler,
          mouseOverHandler: defaultHandlers.mouseOverHandler,
        },
      };
    });
  }

  /**
   * Constructs the three-way property link props for the specified file.
   * @param file The file to construct the three-way property link props for.
   * @returns The three-way property link props.
   */
  private constructThreeWayPropertyLinkProps(
    file: TFile,
    defaultHandlers: EventHandlersForProps,
  ): ThreeWayLinkProps | undefined {
    const directions = ["previous", "next", "parent"] as const;
    const propertyMappings = {
      previous: this.plugin.settings.previousLinkPropertyMappings,
      next: this.plugin.settings.nextLinkPropertyMappings,
      parent: this.plugin.settings.parentLinkPropertyMappings,
    };

    if (directions.every((dir) => propertyMappings[dir].length === 0)) {
      return undefined;
    }

    const threeWayPropertyLink = getThreeWayPropertyLink(this.plugin, file);
    if (directions.every((dir) => threeWayPropertyLink[dir].length === 0)) {
      return undefined;
    }

    return {
      type: "three-way-link",
      source: "property",
      index: 0,
      links: directions.reduce(
        (acc, dir) => {
          if (propertyMappings[dir].length === 0) {
            acc[dir] = { links: [], hidden: true };
            return acc;
          }

          acc[dir] = {
            links: threeWayPropertyLink[dir].map((link) => {
              return {
                type: "prefixed-link",
                prefix: { label: link.prefix, clickHandler: defaultHandlers.prefixClickHandler },
                link: {
                  linkInfo: this.resolveDisplayText(link.link),
                  clickHandler: defaultHandlers.clickHandler,
                  mouseOverHandler: defaultHandlers.mouseOverHandler,
                },
              };
            }),
            hidden: false,
          };
          return acc;
        },
        {} as Record<ThreeWayDirection, { links: PrefixedLinkProps[]; hidden: boolean }>,
      ),
      delimiters: this.plugin.settings.propertyLinkDisplayStyle,
    };
  }

  /**
   * Constructs the periodic note link props for the specified file.
   * @param file The file to construct the periodic note link props for.
   * @returns The periodic note link props.
   */
  private constructPeriodicNoteLinkProps(
    file: TFile,
    defaultHandlers: EventHandlersForProps,
  ): ThreeWayLinkProps | undefined {
    const periodicNotesManager = this.plugin.findComponent(PeriodicNotesManager)!;
    periodicNotesManager.syncActiveState();
    if (!periodicNotesManager.isActive) {
      return undefined;
    }

    const periodicNoteLinks = periodicNotesManager.searchAdjacentNotes(file);
    if (!periodicNoteLinks.currentGranularity) {
      return undefined;
    }

    if (
      !periodicNoteLinks.parentGranularity &&
      !periodicNotesManager.isPrevNextLinkEnabled(periodicNoteLinks.currentGranularity)
    ) {
      return undefined;
    }

    const directions = ["previous", "next", "parent"] as const;
    return {
      type: "three-way-link",
      source: "periodic",
      index: 0,
      links: directions.reduce(
        (acc, dir) => {
          const linkInfo: LinkInfo = {
            destination: periodicNoteLinks.paths[dir] ?? "",
            isExternal: false,
            isResolved: true,
            displayText: "",
          };

          if (dir === "parent") {
            if (!periodicNoteLinks.parentGranularity) {
              acc[dir] = { links: [], hidden: true };
              return acc;
            }
          } else {
            if (
              !periodicNotesManager.isPrevNextLinkEnabled(periodicNoteLinks.currentGranularity!)
            ) {
              acc[dir] = { links: [], hidden: true };
              return acc;
            }
          }

          if (linkInfo.destination.length === 0) {
            acc[dir] = { links: [], hidden: false };
            return acc;
          }

          let clickHandler = defaultHandlers.clickHandler;
          let mouseOverHandler = defaultHandlers.mouseOverHandler;

          if (dir === "parent" && periodicNoteLinks.parentDate !== undefined) {
            // Make unresolved link.
            linkInfo.isResolved = false;
            clickHandler = (target, e) => {
              if (this.plugin.settings.confirmFileCreation) {
                new FileCreationModal(
                  this.plugin,
                  getFileStemFromPath(target.linkInfo.destination),
                  () => {
                    void createPeriodicNote(
                      periodicNoteLinks.parentGranularity!,
                      periodicNoteLinks.parentDate!,
                    );
                  },
                ).open();
              } else {
                void createPeriodicNote(
                  periodicNoteLinks.parentGranularity!,
                  periodicNoteLinks.parentDate!,
                );
              }
            };
            mouseOverHandler = () => {};
          }

          acc[dir] = {
            links: [
              {
                type: "prefixed-link",
                prefix: { label: "", clickHandler: defaultHandlers.prefixClickHandler },
                link: {
                  linkInfo: this.resolveDisplayText(linkInfo),
                  clickHandler,
                  mouseOverHandler,
                },
              },
            ],
            hidden: false,
          };
          return acc;
        },
        {} as Record<ThreeWayDirection, { links: PrefixedLinkProps[]; hidden: boolean }>,
      ),
      delimiters: this.plugin.settings.periodicNoteLinkDisplayStyle,
    };
  }

  /**
   * Constructs the folder link props for the specified file.
   * @param file The file to construct the folder link props for.
   * @returns The folder link props.
   */
  private constructFolderLinkProps(
    file: TFile,
    defaultHandlers: EventHandlersForProps,
  ): ThreeWayLinkProps[] {
    const result: ThreeWayLinkProps[] = [];

    const folderLinksManager = this.plugin.findComponent(FolderLinksManager)!;
    if (!folderLinksManager.isActive) {
      return result;
    }

    for (const adjacentFiles of folderLinksManager.getAdjacentFiles(file)) {
      const settings = this.plugin.settings.folderLinksSettingsArray[adjacentFiles.index];
      const directions = ["previous", "next", "parent"] as const;

      result.push({
        type: "three-way-link",
        source: "folder",
        index: adjacentFiles.index,
        links: directions.reduce(
          (acc, dir) => {
            if (dir === "parent" && settings.parentPath.length === 0) {
              acc[dir] = { links: [], hidden: true };
              return acc;
            }

            acc[dir] = {
              links: adjacentFiles.filePaths[dir].map((path) => {
                const linkInfo: LinkInfo = {
                  destination: path,
                  isExternal: false,
                  isResolved: true,
                  displayText: "",
                };

                return {
                  type: "prefixed-link",
                  prefix: {
                    label: settings.linkPrefix,
                    clickHandler: defaultHandlers.prefixClickHandler,
                  },
                  link: {
                    linkInfo: this.resolveDisplayText(linkInfo),
                    clickHandler: defaultHandlers.clickHandler,
                    mouseOverHandler: defaultHandlers.mouseOverHandler,
                  },
                };
              }),
              hidden: false,
            };
            return acc;
          },
          {} as Record<ThreeWayDirection, { links: PrefixedLinkProps[]; hidden: boolean }>,
        ),
        delimiters: settings.displayStyle,
      });
    }

    return result;
  }

  /**
   * Constructs the pinned note content props for the specified file.
   * @param file The file to construct the pinned note content props for.
   * @returns The pinned note content props.
   */
  private async constructPinnedNoteContentProps(
    file: TFile,
    defaultHandlers: EventHandlersForProps,
  ): Promise<NoteContentProps[]> {
    if (this.plugin.settings.annotationStringsForPinning.length === 0) {
      return [];
    }

    return (await getPinnedNoteContents(this.plugin, file)).map((pinnedNoteContent) => {
      return {
        type: "note-content",
        prefix: {
          label: pinnedNoteContent.prefix,
          clickHandler: defaultHandlers.prefixClickHandler,
        },
        content: pinnedNoteContent.content.map((item) => {
          if (typeof item === "string") {
            return item;
          } else {
            return {
              linkInfo: this.resolveDisplayText(item, false),
              clickHandler: defaultHandlers.clickHandler,
              mouseOverHandler: defaultHandlers.mouseOverHandler,
            };
          }
        }),
      };
    });
  }

  /**
   * Constructs the annotated link props for the specified file.
   * @param file The file to construct the annotated link props for.
   * @returns The annotated link props.
   * @throws {PluginError} Throws when the `AnnotatedLinksManager` has been reset
   *     during async operation.
   */
  private async *constructAnnotatedLinkProps(
    file: TFile,
    defaultHandlers: EventHandlersForProps,
  ): AsyncGenerator<PrefixedLinkProps[]> {
    const annotatedLinksManager = this.plugin.findComponent(AnnotatedLinksManager)!;
    if (!annotatedLinksManager.isActive) {
      return;
    }

    const generator = annotatedLinksManager.searchAnnotatedLinks(file);
    for await (const links of generator) {
      yield links.map((link) => {
        return {
          type: "prefixed-link",
          prefix: { label: link.prefix, clickHandler: defaultHandlers.prefixClickHandler },
          link: {
            linkInfo: this.resolveDisplayText(link.link),
            clickHandler: defaultHandlers.clickHandler,
            mouseOverHandler: defaultHandlers.mouseOverHandler,
          },
        };
      });
    }
  }

  /**
   * Resolves and sets the display text of the given link information.
   * If `linkInfo.displayText` is already set, the link information is returned as-is.
   * Otherwise, the display text is determined according to the following priority:
   * 1. If the link is external, use the destination URL/path.
   * 2. If `usePropertyValue` is `true` and a property name is configured,
   *    attempt to read the first string value from the linked file's property.
   * 3. Fallback to the file stem derived from the destination path.
   * This method creates and returns a new `LinkInfo` instance with the resolved display text.
   * @param linkInfo The link information whose display text should be resolved.
   * @param usePropertyValue Whether to use a file property value as the display text
   *     when available. Defaults to `true`.
   * @returns A new `LinkInfo` instance with the resolved display text.
   */
  private resolveDisplayText(linkInfo: LinkInfo, usePropertyValue: boolean = true): LinkInfo {
    if (linkInfo.displayText.length > 0) {
      return { ...linkInfo };
    }

    if (linkInfo.isExternal) {
      return { ...linkInfo, displayText: linkInfo.destination };
    }

    if (usePropertyValue) {
      const propertyName = this.plugin.settings.propertyNameForDisplayText;
      if (propertyName) {
        const linkedFile = this.plugin.app.vault.getFileByPath(linkInfo.destination);
        if (linkedFile) {
          const values = getStringValuesFromFileProperty(this.plugin.app, linkedFile, propertyName);
          if (values.length > 0) {
            return { ...linkInfo, displayText: values[0] };
          }
        }
      }
    }

    return { ...linkInfo, displayText: getFileStemFromPath(linkInfo.destination) };
  }
}
