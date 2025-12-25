import type { App, TFile } from "obsidian";
import type NavLinkHeader from "./main";
import type { LinkInfo } from "./types";
import { parseMarkdownLink, parseWikiLink, sanitizeRegexInput } from "./utils";

/**
 * The interface representing a pinned note content.
 * Each pinned note content consists of a prefix (e.g., an emoji) and an array of content items.
 * Each content item can be either a string (plain text) or an object representing a link.
 */
export interface PinnedNoteContentInfo {
  prefix: string;
  content: (LinkInfo | string)[];
}

/**
 * Gets the pinned note contents from the specified file.
 * @param plugin The `NavLinkHeader` plugin instance.
 * @param file The file to search in.
 * @returns The array of pinned note contents.
 */
export async function getPinnedNoteContents(
  plugin: NavLinkHeader,
  file: TFile
): Promise<PinnedNoteContentInfo[]> {
  const annotationStrings = plugin.settings.annotationStringsForPinning;
  const startMarker = plugin.settings.startMarkerForPinning;
  const endMarker = plugin.settings.endMarkerForPinning;
  const sanitizedStartMarker = sanitizeRegexInput(startMarker);
  const sanitizedEndMarker = sanitizeRegexInput(endMarker);

  const content = await plugin.app.vault.cachedRead(file);
  const result: { index: number; content: PinnedNoteContentInfo }[] = [];
  for (const annotationString of annotationStrings) {
    const sanitizedAnnotationString = sanitizeRegexInput(annotationString);

    const regex = new RegExp(`${sanitizedAnnotationString}(.+)`, "g");
    for (const match of content.matchAll(regex)) {
      if (startMarker !== "" && endMarker !== "" && match[1].startsWith(startMarker)) {
        continue;
      }
      const parsed = parsePinnedNoteContent(plugin.app, file, match[1]);
      parsed.prefix = annotationString;
      result.push({ index: match.index, content: parsed });
    }

    if (startMarker !== "" && endMarker !== "") {
      const blockRegex = new RegExp(
        `${sanitizedAnnotationString}${sanitizedStartMarker}(.+?)${sanitizedEndMarker}`,
        "gs"
      );
      for (const match of content.matchAll(blockRegex)) {
        const parsed = parsePinnedNoteContent(
          plugin.app,
          file,
          match[1].replace(/\n/g, " ").trim()
        );
        parsed.prefix = annotationString;
        result.push({ index: match.index, content: parsed });
      }
    }
  }

  return result.sort((a, b) => a.index - b.index).map((item) => item.content);
}

/**
 * Parses the pinned note content string into a `PinnedNoteContent` object.
 * @param app The Obsidian app instance.
 * @param file The file containing the pinned note content.
 * @param content The pinned note content string.
 * @returns The parsed `PinnedNoteContent` object.
 */
function parsePinnedNoteContent(app: App, file: TFile, content: string): PinnedNoteContentInfo {
  const matchInfos: {
    index: number;
    length: number;
    type: "wiki" | "markdown" | "url";
    text: string;
  }[] = [];

  for (const match of content.matchAll(/\[\[[^[\]]+\]\]/g)) {
    matchInfos.push({
      index: match.index,
      length: match[0].length,
      type: "wiki",
      text: match[0],
    });
  }

  for (const match of content.matchAll(/\[[^[\]]+\]\([^()]+\)/g)) {
    matchInfos.push({
      index: match.index,
      length: match[0].length,
      type: "markdown",
      text: match[0],
    });
  }

  for (const match of content.matchAll(/\b(https?:\/\/[^\s<>()]+)/g)) {
    matchInfos.push({
      index: match.index,
      length: match[0].length,
      type: "url",
      text: match[1],
    });
  }

  matchInfos.sort((a, b) => a.index - b.index);

  const result: PinnedNoteContentInfo = { prefix: "", content: [] };
  let cursor = 0;
  let matchIndex = 0;
  while (true) {
    if (matchIndex >= matchInfos.length) {
      if (cursor < content.length) {
        result.content.push(content.substring(cursor));
      }
      break;
    }

    const matchInfo = matchInfos[matchIndex];

    if (cursor < matchInfo.index) {
      result.content.push(content.substring(cursor, matchInfo.index));
      cursor = matchInfo.index;
    } else if (cursor > matchInfo.index) {
      matchIndex += 1;
      continue;
    }

    let destination: string | undefined = undefined;
    let isExternal: boolean = false;
    let displayText: string | undefined = undefined;
    if (matchInfo.type === "wiki") {
      const parsed = parseWikiLink(matchInfo.text);
      destination = parsed.path;
      isExternal = false;
      displayText = parsed.displayText;
    } else if (matchInfo.type === "markdown") {
      const parsed = parseMarkdownLink(matchInfo.text);
      destination = parsed.destination;
      isExternal = parsed.isValidExternalLink;
      displayText = parsed.displayText;
    } else {
      if (URL.canParse(matchInfo.text)) {
        destination = matchInfo.text;
        isExternal = true;
        displayText = matchInfo.text;
      }
    }

    if (!isExternal && destination !== undefined) {
      const linkedFile = app.metadataCache.getFirstLinkpathDest(destination, file.path);
      if (linkedFile) {
        destination = linkedFile.path;
      } else {
        destination = undefined;
      }
    }

    if (destination === undefined) {
      const lastIndex = result.content.length - 1;
      if (lastIndex >= 0 && typeof result.content[lastIndex] === "string") {
        result.content[lastIndex] += matchInfo.text;
      } else {
        result.content.push(matchInfo.text);
      }
    } else {
      result.content.push({
        destination,
        isExternal,
        isResolved: true,
        displayText: displayText ?? "",
      });
    }

    cursor = matchInfo.index + matchInfo.length;
    matchIndex += 1;
  }

  return result;
}
