import { Component, TFile } from "obsidian";
import { NavigationComponent } from "./navigationComponent.svelte";
import type NavLinkHeader from "./main";

/**
 * The base class for updating the navigation links.
 */
export class Updater {
	constructor(protected plugin: NavLinkHeader) {}

	/**
	 * Adds the navigation component to the specified element.
	 * Updates it if the component already exists.
	 * @param parent The parent component to add the navigation component to.
	 * @param container The container element to add the navigation links to.
	 * @param nextSibling The element to add the navigation links before.
	 * @param file The file object currently opened in the parent component.
	 * @param hoverParent The parent component to add the hover popover to.
	 * @param forced See `NavigationComponent.update`.
	 */
	protected updateNavigation({
		parent,
		container,
		nextSibling,
		file,
		hoverParent,
		forced,
	}: {
		parent: Component;
		container: Element;
		nextSibling: Element | null;
		file: TFile;
		hoverParent: Component;
		forced: boolean;
	}): void {
		let navigation = container.querySelector(".nav-link-header-navigation");

		// Creates a new element for the navigation links, if not already added.
		if (!navigation) {
			navigation = container.createDiv({
				cls: "nav-link-header-navigation",
			});
			if (nextSibling) {
				container.insertBefore(navigation, nextSibling);
			}

			parent.addChild(new NavigationComponent(this.plugin, navigation));
		}

		if ("_children" in parent && parent._children instanceof Array) {
			for (const child of parent._children) {
				if (child instanceof NavigationComponent) {
					void child.update(file, hoverParent, forced);
					break;
				}
			}
		}
	}
}
