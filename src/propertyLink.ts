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
  return getPropertyLinksWithMapping(plugin, file, plugin.settings.propertyMappings);
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
  previous: { destination: string; isExternal: boolean; prefix: string; displayText?: string }[];
  next: { destination: string; isExternal: boolean; prefix: string; displayText?: string }[];
  parent: { destination: string; isExternal: boolean; prefix: string; displayText?: string }[];
} {
  return {
    previous: getPropertyLinksWithMapping(
      plugin,
      file,
      plugin.settings.previousLinkPropertyMappings
    ),
    next: getPropertyLinksWithMapping(plugin, file, plugin.settings.nextLinkPropertyMappings),
    parent: getPropertyLinksWithMapping(plugin, file, plugin.settings.parentLinkPropertyMappings),
  };
}

/**
 * Gets links from the frontmatter properties of the specified file.
 * @param plugin The NavLinkHeader plugin instance.
 * @param file The file to search in.
 * @param mappings The property mappings to search for links.
 * @returns The array of links. Each link contains the destination (file path for internal links
 *     or URL for external links), whether the link is external, the prefix (typically an emoji),
 *     and the display text (if specified).
 */
function getPropertyLinksWithMapping(
  plugin: NavLinkHeader,
  file: TFile,
  mappings: { property: string; prefix: string }[]
): {
  destination: string;
  isExternal: boolean;
  prefix: string;
  displayText?: string;
}[] {
  const result: ReturnType<typeof getPropertyLinks> = [];
  const implicitPropertyManager = plugin.findComponent(ImplicitPropertyManager)!;

  for (const { property, prefix } of mappings) {
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
