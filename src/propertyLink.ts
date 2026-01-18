import type { TFile } from "obsidian";
import type NavLinkHeader from "./main";
import type { PrefixedLinkInfo, ThreeWayDirection } from "./types";
import { ImplicitPropertyManager } from "./implicitPropertyManager";
import { getLinksFromFileProperty } from "./utils";

/**
 * Gets links from the frontmatter properties of the specified file.
 * @param plugin The `NavLinkHeader` plugin instance.
 * @param file The file to search in.
 * @returns The array of links.
 */
export function getPropertyLinks(plugin: NavLinkHeader, file: TFile): PrefixedLinkInfo[] {
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
  file: TFile,
): Record<ThreeWayDirection, PrefixedLinkInfo[]> {
  return {
    previous: getPropertyLinksWithMapping(
      plugin,
      file,
      plugin.settings.previousLinkPropertyMappings,
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
 * @returns The array of links.
 */
function getPropertyLinksWithMapping(
  plugin: NavLinkHeader,
  file: TFile,
  mappings: { property: string; prefix: string }[],
): PrefixedLinkInfo[] {
  const result: PrefixedLinkInfo[] = [];
  const implicitPropertyManager = plugin.findComponent(ImplicitPropertyManager)!;

  for (const { property, prefix } of mappings) {
    const links = getLinksFromFileProperty(plugin.app, file, property);

    const destinations = new Set<string>();
    for (const link of links) {
      result.push({ prefix, link });
      destinations.add(link.destination);
    }

    if (implicitPropertyManager.isActive) {
      const implicitLinks = implicitPropertyManager.getImplicitPropertyValues(file, property);
      for (const destination of implicitLinks) {
        if (!destinations.has(destination)) {
          result.push({
            prefix,
            link: {
              destination,
              isExternal: false,
              isResolved: true,
              displayText: "",
            },
          });
        }
      }
    }
  }

  return result;
}
