import type { App, TFile } from "obsidian";
import type NavLinkHeader from "./main";
import { getStringValuesFromFileProperty, parseMarkdownLink, parseWikiLink } from "./utils";

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

  const propertyMappings = plugin.settings.propertyMappings;
  for (const { property, prefix } of propertyMappings) {
    const links = getLinksFromFileProperty(plugin.app, file, property);

    for (const { destination, isExternal, displayText } of links) {
      result.push({
        destination,
        isExternal,
        prefix,
        displayText,
      });
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
  previous?: { destination: string; isExternal: boolean; displayText?: string };
  next?: { destination: string; isExternal: boolean; displayText?: string };
  parent?: { destination: string; isExternal: boolean; displayText?: string };
} {
  const result: ReturnType<typeof getThreeWayPropertyLink> = {
    previous: undefined,
    next: undefined,
    parent: undefined,
  };

  if (plugin.settings.previousLinkProperty) {
    const links = getLinksFromFileProperty(plugin.app, file, plugin.settings.previousLinkProperty);
    if (links.length > 0) {
      result.previous = links[0];
    }
  }

  if (plugin.settings.nextLinkProperty) {
    const links = getLinksFromFileProperty(plugin.app, file, plugin.settings.nextLinkProperty);
    if (links.length > 0) {
      result.next = links[0];
    }
  }

  if (plugin.settings.parentLinkProperty) {
    const links = getLinksFromFileProperty(plugin.app, file, plugin.settings.parentLinkProperty);
    if (links.length > 0) {
      result.parent = links[0];
    }
  }

  return result;
}

/**
 * Gets the links to the files specified in the file property.
 * @param app The application instance.
 * @param file The file to search in.
 * @param propertyName The name of the property to search for links.
 * @returns The array of links. Each link contains the destination (file path for internal links
 *     or URL for external links), whether the link is external,
 *     and the display text (if specified).
 *     If the property does not exist or valid links are not found, an empty array is returned.
 */
function getLinksFromFileProperty(
  app: App,
  file: TFile,
  propertyName: string
): {
  destination: string;
  isExternal: boolean;
  displayText?: string;
}[] {
  const result: ReturnType<typeof getLinksFromFileProperty> = [];

  const propertyValues = getStringValuesFromFileProperty(app, file, propertyName);

  for (const value of propertyValues) {
    let destination = value;
    let isExternal = false;
    let displayText: string | undefined = undefined;

    const parsedWikiLink = parseWikiLink(value);
    if (parsedWikiLink.path) {
      destination = parsedWikiLink.path;
      displayText = parsedWikiLink.displayText;
    } else {
      const parsedMarkdownLink = parseMarkdownLink(value);
      if (parsedMarkdownLink.destination) {
        destination = parsedMarkdownLink.destination;
        isExternal = parsedMarkdownLink.isValidExternalLink;
        displayText = parsedMarkdownLink.displayText;
      } else {
        isExternal = URL.canParse(value);
      }
    }

    if (!isExternal) {
      const linkedFile = app.metadataCache.getFirstLinkpathDest(destination, file.path);
      if (!linkedFile) {
        continue;
      }
      destination = linkedFile.path;
    }

    result.push({
      destination,
      isExternal,
      displayText,
    });
  }

  return result;
}
