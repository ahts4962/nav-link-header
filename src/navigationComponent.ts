import { Component, TFile } from "obsidian";
import { searchAnnotatedLinks } from "./annotatedLink";
import type NavLinkHeader from "./main";
import {
	type LinkEventHandler,
	NavigationLinkState,
} from "./navigationLinkState";
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
			periodicNoteLinksPromise: Promise.resolve(undefined),
			annotatedLinksPromise: this.getAnnotatedLinkStates(
				file,
				hoverParent
			),
			showPlaceholder: false,
		});
	}

	private async getAnnotatedLinkStates(
		file: TFile,
		hoverParent: Component
	): Promise<NavigationLinkState[]> {
		if (!this.plugin.settings?.annotatedLinksEnabled) {
			return [];
		}

		const filePath = file.path;
		const annotationStrings = this.plugin.settings.annotationStrings
			.split(",")
			.map((s) => s.trim());

		const annotatedLinks = await searchAnnotatedLinks(
			this.plugin.app,
			annotationStrings,
			file
		);

		if (!this.loaded) {
			throw new NavLinkHeaderError(
				"The navigation component is not loaded."
			);
		}

		const clickHandler: LinkEventHandler = (target, e) => {
			void this.plugin.app.workspace.openLinkText(
				target.destinationPath!,
				filePath,
				e.ctrlKey
			);
		};

		const mouseOverHandler: LinkEventHandler = (target, e) => {
			this.plugin.app.workspace.trigger("hover-link", {
				event: e,
				source: "nav-link-header",
				hoverParent,
				targetEl: e.target,
				linktext: target.destinationPath,
				sourcePath: filePath,
			});
		};

		const linkStates = annotatedLinks.map(
			(link) =>
				new NavigationLinkState({
					enabled: true,
					destinationPath: link.destinationPath,
					fileExists: true,
					annotation: link.annotation,
					clickHandler,
					mouseOverHandler,
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

	/**
	 * Destroys the navigation component.
	 */
	public onunload(): void {
		this.navigation?.$destroy();
		this.currentFilePath = undefined;
		this.loaded = false;
	}
}
