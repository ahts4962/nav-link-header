import { Component, TFile } from "obsidian";
import { searchAnnotatedLinks } from "./annotatedLink";
import type NavLinkHeader from "./main";
import { NavigationLinkState } from "./navigationLinkState";
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

		if (!this.plugin.settings?.annotatedLinksEnabled) {
			return;
		}

		const annotationStrings = this.plugin.settings.annotationStrings
			.split(",")
			.map((s) => s.trim());

		const promise = searchAnnotatedLinks(
			this.plugin.app,
			annotationStrings,
			file
		).then((annotatedLinks) => {
			if (!this.loaded) {
				throw new Error("The navigation component is not loaded.");
			}

			const clickHandler = (
				target: NavigationLinkState,
				e: MouseEvent
			) => {
				void this.plugin.app.workspace.openLinkText(
					target.destinationPath,
					this.currentFilePath!,
					e.ctrlKey
				);
			};

			const mouseOverHandler = (
				target: NavigationLinkState,
				e: MouseEvent
			) => {
				if (target.fileExists) {
					this.plugin.app.workspace.trigger("hover-link", {
						event: e,
						source: "nav-link-header",
						hoverParent,
						targetEl: e.target,
						linktext: target.destinationPath,
						sourcePath: this.currentFilePath,
					});
				}
			};

			const links = annotatedLinks.map(
				(link) =>
					new NavigationLinkState(
						link.destinationPath,
						true,
						clickHandler,
						mouseOverHandler,
						link.annotation
					)
			);

			links.sort((a, b) => {
				const diff =
					annotationStrings.indexOf(a.annotation!) -
					annotationStrings.indexOf(b.annotation!);
				if (diff !== 0) {
					return diff;
				}
				return a.title.localeCompare(b.title);
			});
			return links;
		});

		this.navigation?.$set({
			navigationLinkStates: promise,
		});
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
