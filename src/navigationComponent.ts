import { type Moment } from "moment";
import { Component, TFile } from "obsidian";
import { type IGranularity } from "obsidian-daily-notes-interface";
import { searchAnnotatedLinks, getPropertyLinks } from "./annotatedLink";
import { FileCreationModal } from "./fileCreationModal";
import type NavLinkHeader from "./main";
import {
	NavigationLinkState,
	type PeriodicNoteLinkStates,
} from "./navigationLinkState";
import { createPeriodicNote } from "./periodicNotes";
import { NavLinkHeaderError } from "./utils";
import Navigation from "./ui/Navigation.svelte";

/**
 * Navigation component to add the navigation links to.
 */
export class NavigationComponent extends Component {
	private navigation?: Navigation;
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
		this.navigation = new Navigation({
			target: this.containerEl,
			props: {
				settings: this.plugin.settings,
			},
		});
		this.loaded = true;
	}

	/**
	 * Updates the navigation component with the specified file.
	 * @param file The file object currently opened in the parent component.
	 * @param hoverParent The parent component to add the hover popover when
	 *    the link in this component is hovered.
	 * @param forced If `true`, the navigation component is always updated.
	 *    If `false`, the navigation component will not be updated if the file path
	 *    has not changed since the last update.
	 */
	public update(file: TFile, hoverParent: Component, forced: boolean): void {
		if (!this.loaded) {
			return;
		}

		// Prevents unnecessary updates.
		if (!forced && this.currentFilePath === file.path) {
			return;
		}
		this.currentFilePath = file.path;

		this.navigation?.$set({
			periodicNoteLinks: this.getPeriodicNoteLinkStates(
				file,
				hoverParent
			),
			annotatedLinksPromise: this.getAnnotatedLinkStates(file, hoverParent),
			displayPlaceholder: this.plugin.settings?.displayPlaceholder,
			settings: this.plugin.settings,
		});
	}

	private async getAnnotatedLinkStates(
		file: TFile,
		hoverParent: Component
	): Promise<NavigationLinkState[]> {
		if (!this.plugin.settings!.annotatedLinksEnabled) {
			return [];
		}

		const filePath = file.path;
		const annotationStrings = this.plugin.settings!.annotationStrings.split(",");
		const propertyNames = this.plugin.settings!.propertyMappings.map(mapping => mapping.property);

		// If no annotation strings are specified, return an empty array
		if (annotationStrings.length + propertyNames.length === 0) {
			return [];
		}

		if (!this.loaded) {
			throw new NavLinkHeaderError(
				"The navigation component is not loaded."
			);
		}
		
		const [annotatedLinks, propertyLinks] = await Promise.all([
			searchAnnotatedLinks(
				this.plugin.app,
				annotationStrings,
				this.plugin.settings!.allowSpaceAfterAnnotationString,
				file
			),
			getPropertyLinks(
				this.plugin.app,
				propertyNames,
				file,
				this.plugin.settings?.usePropertyAsDisplayName 
					? this.plugin.settings?.displayPropertyName 
					: undefined
			)
		]);

		// Get property values for all links if needed
		const propertyValuesForAnnotatedLinks = this.plugin.settings?.usePropertyAsDisplayName
			? await Promise.all(
				annotatedLinks.map(async (link) => {
					const linkedFile = this.plugin.app.metadataCache.getFirstLinkpathDest(
						link.destinationPath,
						file.path
					);
					if (!linkedFile) return undefined;
					
					const linkedFileCache = this.plugin.app.metadataCache.getFileCache(linkedFile);
					if (linkedFileCache?.frontmatter && this.plugin.settings?.displayPropertyName) {
						return linkedFileCache.frontmatter[this.plugin.settings.displayPropertyName];
					}
					return undefined;
				})
			)
			: annotatedLinks.map(() => undefined);

		// Combine all links and convert to NavigationLinkState
		const allLinks = [
			...annotatedLinks.map((link, index) => ({ 
				...link, 
				isPropertyLink: false,
				propertyValue: propertyValuesForAnnotatedLinks[index]
			})),
			...propertyLinks.map(link => ({ 
				...link, 
				isPropertyLink: true 
			}))
		];

		// Filter duplicates if needed
		const seenPaths = new Set<string>();
		const uniqueLinks = this.plugin.settings?.filterDuplicateNotes 
			? allLinks.filter(link => {
				if (seenPaths.has(link.destinationPath)) {
					return false;
				}
				seenPaths.add(link.destinationPath);
				return true;
			})
			: allLinks;

		// Convert to NavigationLinkState
		let linkStates = uniqueLinks.map(
			(link) =>
				new NavigationLinkState({
					enabled: true,
					destinationPath: link.destinationPath,
					fileExists: true,
					annotation: link.annotation,
					isPropertyLink: link.isPropertyLink,
					propertyValue: link.propertyValue,
					clickHandler: (target, e) => {
						void this.plugin.app.workspace.openLinkText(
							target.destinationPath!,
							filePath,
							e.ctrlKey
						);
					},
					mouseOverHandler: (target, e) => {
						this.plugin.app.workspace.trigger("hover-link", {
							event: e,
							source: "nav-link-header",
							hoverParent,
							targetEl: e.target,
							linktext: target.destinationPath,
							sourcePath: filePath,
						});
					},
				})
		);

		linkStates.sort((a, b) => {
			const diff =
				annotationStrings.indexOf(a.annotation!) -
				annotationStrings.indexOf(b.annotation!);
			if (diff !== 0) {
				return diff;
			}
			return a.title.localeCompare(b.title);
		});

		return linkStates;

	}	

	private getPeriodicNoteLinkStates(
		file: TFile,
		hoverParent: Component
	): PeriodicNoteLinkStates | undefined {
		const filePath = file.path;

		const periodicNoteLinks =
			this.plugin.periodicNotesManager?.searchAdjacentNotes(file);

		if (!periodicNoteLinks) {
			return undefined;
		}

		const convert = (
			path: string,
			date: Moment | undefined,
			granularity: IGranularity | undefined
		): NavigationLinkState => {
			if (path) {
				return new NavigationLinkState({
					enabled: true,
					destinationPath: path,
					fileExists: date === undefined,
					clickHandler: (target, e) => {
						if (target.fileExists) {
							void this.plugin.app.workspace.openLinkText(
								target.destinationPath!,
								filePath,
								e.ctrlKey
							);
						} else {
							if (this.plugin.settings!.confirmFileCreation) {
								new FileCreationModal(
									this.plugin,
									target.title,
									() => {
										void createPeriodicNote(
											granularity!,
											date!
										);
									}
								).open();
							} else {
								void createPeriodicNote(granularity!, date!);
							}
						}
					},
					mouseOverHandler: (target, e) => {
						if (target.fileExists) {
							this.plugin.app.workspace.trigger("hover-link", {
								event: e,
								source: "nav-link-header",
								hoverParent,
								targetEl: e.target,
								linktext: target.destinationPath,
								sourcePath: filePath,
							});
						}
					},
				});
			} else {
				return new NavigationLinkState({
					enabled: false,
				});
			}
		};

		return {
			previous: convert(
				periodicNoteLinks.previousPath,
				undefined,
				undefined
			),
			next: convert(periodicNoteLinks.nextPath, undefined, undefined),
			up: convert(
				periodicNoteLinks.upPath,
				periodicNoteLinks.upDate,
				periodicNoteLinks.upGranularity
			),
		};
	}

	public onunload(): void {
		this.navigation?.$destroy();
		this.currentFilePath = undefined;
		this.loaded = false;
	}
}
