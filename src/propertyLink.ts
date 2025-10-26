import type { TFile } from "obsidian";
import type NavLinkHeader from "./main";
import { ImplicitPropertyManager } from "./implicitPropertyManager";
import { getLinksFromFileProperty } from "./utils";

/**
 * Gets links from the frontmatter properties of the specified file.
 * @param plugin The NavLinkHeader plugin instance.
 * @param file The file to search in.
 * @returns The array of links. Each link contains the destination (file path for internal links
 *     or URL for external links), whether the link is external, the prefix (typically an emoji),
 *     and the display text (if specified).
 */
export function getPropertyLinks(
  plugin: NavLinkHeader,
  file: TFile
): {
  destination: string;
  isExternal: boolean;
  prefix: string;
  displayText?: string;
}[] {
  const result: ReturnType<typeof getPropertyLinks> = [];
  const implicitPropertyManager = plugin.findComponent(ImplicitPropertyManager)!;

  const propertyMappings = plugin.settings.propertyMappings;
  for (const { property, prefix } of propertyMappings) {
    const links = getLinksFromFileProperty(plugin.app, file, property);

    const destinations = [];
    for (const { destination, isExternal, displayText } of links) {
      result.push({
        destination,
        isExternal,
        prefix,
        displayText,
      });
      destinations.push(destination);
    }

    if (implicitPropertyManager.isActive) {
      const implicitLinks = implicitPropertyManager.getImplicitPropertyValues(file, property);
      for (const destination of implicitLinks) {
        if (!destinations.includes(destination)) {
          result.push({
            destination,
            isExternal: false,
            prefix,
            displayText: undefined,
          });
        }
      }
    }
  }

  return result;
}

/**
 * Gets the three-way link from the frontmatter properties of the specified file.
 * @param plugin The NavLinkHeader plugin instance.
 * @param file The file to search in.
 * @returns The three-way link.
 */
export function getThreeWayPropertyLink(
  plugin: NavLinkHeader,
  file: TFile
): {
  previous?: { destination: string; isExternal: boolean; prefix: string; displayText?: string };
  next?: { destination: string; isExternal: boolean; prefix: string; displayText?: string };
  parent?: { destination: string; isExternal: boolean; prefix: string; displayText?: string };
} {
  return {
    previous: getFirstPropertyLink(plugin, file, plugin.settings.previousLinkPropertyMappings),
    next: getFirstPropertyLink(plugin, file, plugin.settings.nextLinkPropertyMappings),
    parent: getFirstPropertyLink(plugin, file, plugin.settings.parentLinkPropertyMappings),
  };
}

/**
 * Gets the first link found from the specified property mappings.
 * @param plugin The NavLinkHeader plugin instance.
 * @param file The file to search in.
 * @param mappings The property mappings to search for links.
 * @returns The link found, or undefined if no link is found.
 */
function getFirstPropertyLink(
  plugin: NavLinkHeader,
  file: TFile,
  mappings: { property: string; prefix: string }[]
):
  | {
      destination: string;
      isExternal: boolean;
      prefix: string;
      displayText?: string;
    }
  | undefined {
  const implicitPropertyManager = plugin.findComponent(ImplicitPropertyManager)!;

  for (const { property, prefix } of mappings) {
    const links = getLinksFromFileProperty(plugin.app, file, property);
    if (links.length > 0) {
      return {
        destination: links[0].destination,
        isExternal: links[0].isExternal,
        prefix: prefix,
        displayText: links[0].displayText,
      };
    }

    if (implicitPropertyManager.isActive) {
      const implicitLinks = implicitPropertyManager.getImplicitPropertyValues(file, property);
      if (implicitLinks.length > 0) {
        return {
          destination: implicitLinks[0],
          isExternal: false,
          prefix: prefix,
          displayText: undefined,
        };
      }
    }
  }

  return undefined;
}
