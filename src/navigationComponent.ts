import { type Moment } from "moment";
import { Component, TFile } from "obsidian";
import { type IGranularity } from "obsidian-daily-notes-interface";
import { searchAnnotatedLinks } from "./annotatedLink";
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
			annotatedLinksPromise: Promise.all([
				this.getAnnotatedLinkStates(file, hoverParent),
				this.getPropertyLinks(file, hoverParent)
			]).then(([annotated, property]) => [...annotated, ...property]),
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
		const annotationStrings = this.plugin
			.settings!.annotationStrings.split(",")
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		if (annotationStrings.length === 0) {
			return [];
		}

		const annotatedLinks = await searchAnnotatedLinks(
			this.plugin.app,
			annotationStrings,
			this.plugin.settings!.allowSpaceAfterAnnotationString,
			file
		);

		if (!this.loaded) {
			throw new NavLinkHeaderError(
				"The navigation component is not loaded."
			);
		}

		const linkStates = annotatedLinks.map(
			(link) =>
				new NavigationLinkState({
					enabled: true,
					destinationPath: link.destinationPath,
					fileExists: true,
					annotation: link.annotation,
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

	private async getPropertyLinks(
		file: TFile,
		hoverParent: Component
	): Promise<NavigationLinkState[]> {
		const cache = this.plugin.app.metadataCache.getFileCache(file);
		if (!cache || !cache.frontmatter) {
			return [];
		}

		const links: NavigationLinkState[] = [];
		const seenPaths = new Set<string>();

		// 确保 settings 存在并且 upLinkProperties 是一个数组
		const properties = this.plugin.settings?.upLinkProperties?.split(",").map(p => p.trim()).filter(p => p.length > 0) || [];
		if (properties.length === 0) {
			return [];
		}

		const linkedFiles = this.plugin.app.metadataCache.resolvedLinks[file.path] || {};

		for (const [linkedPath, _] of Object.entries(linkedFiles)) {
			const linkedFile = this.plugin.app.vault.getAbstractFileByPath(linkedPath);
			if (!(linkedFile instanceof TFile)) {
				continue;
			}

			// 如果这个文件路径已经被添加过了，就跳过
			if (seenPaths.has(linkedFile.path)) {
				continue;
			}

			// 检查这个链接是否来自指定的属性
			for (const property of properties) {
				const value = cache.frontmatter[property];
				if (!value) continue;

				const propertyValue = String(value);
				if (propertyValue.includes(linkedFile.basename)) {
					seenPaths.add(linkedFile.path);
					links.push(
						new NavigationLinkState({
							enabled: true,
							destinationPath: linkedFile.path,
							fileExists: true,
							annotation: property,
							isPropertyLink: true,
							clickHandler: (target, e) => {
								void this.plugin.app.workspace.openLinkText(
									target.destinationPath!,
									file.path,
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
									sourcePath: file.path,
								});
							},
						})
					);
				}
			}
		}

		return links;
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
