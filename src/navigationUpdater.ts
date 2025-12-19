import type { Component, TFile } from "obsidian";
import type NavLinkHeader from "./main";
import { NavigationComponent } from "./navigationComponent.svelte";
import { PluginComponent } from "./pluginComponent";

/**
 * The base class for updating navigation headers.
 */
export class NavigationUpdater extends PluginComponent {
  protected static readonly navigationElementClassName: string = "nav-link-header-navigation";

  constructor(protected plugin: NavLinkHeader) {
    super();
  }

  /**
   * Creates and returns a `NavigationComponent`.
   * If the component already exists, returns the existing one.
   * @param parent The parent component to add the `NavigationComponent` to.
   * @param container The container element to add the navigation header to.
   * @param nextSibling The element to add the navigation header before.
   *     If null, the header will be added at the top of the container.
   * @return The created or existing `NavigationComponent`, or `undefined`
   *     if it could not be retrieved.
   */
  protected getNavigationComponent({
    parent,
    container,
    nextSibling,
  }: {
    parent: Component;
    container: Element;
    nextSibling: Element | null;
  }): NavigationComponent | undefined {
    let navigationElement = container.querySelector(
      `.${NavigationUpdater.navigationElementClassName}`
    );

    // Creates a new element for the navigation header, if not already added.
    if (!navigationElement) {
      navigationElement = container.createDiv({
        cls: NavigationUpdater.navigationElementClassName,
      });
      if (nextSibling) {
        container.insertBefore(navigationElement, nextSibling);
      } else {
        container.prepend(navigationElement);
      }

      parent.addChild(new NavigationComponent(this.plugin, navigationElement));
    }

    if ("_children" in parent && parent._children instanceof Array) {
      for (const child of parent._children) {
        if (child instanceof NavigationComponent) {
          return child;
        }
      }
    }

    return undefined;
  }
}
