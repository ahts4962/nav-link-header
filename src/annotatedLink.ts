import { App, TFile } from "obsidian";
import { removeCode } from "./utils";

/**
 * Searches the annotated links from the content of the backlinks of the specified file.
 * @param app The application instance.
 * @param annotationStrings The links annotated with these strings will be searched.
 * @param allowSpace If true, the link is still recognized as an annotated link
 *     even if there is a space between the annotation string and the link.
 * @param file The file from which the annotated links will be searched.
 * @returns The array of the annotated links.
 */
export async function searchAnnotatedLinks(
	app: App,
	annotationStrings: string[],
	allowSpace: boolean,
	file: TFile
): Promise<{ destinationPath: string; annotation: string }[]> {
	const backlinks = Object.entries(app.metadataCache.resolvedLinks)
		.filter(([, destinations]) =>
			Object.keys(destinations).includes(file.path)
		)
		.map(([source]) => source);

	const result: { destinationPath: string; annotation: string }[] = [];
	const optionalSpace = allowSpace ? " ?" : "";

	for (const backlink of backlinks) {
		const backlinkFile = app.vault.getFileByPath(backlink);
		if (!backlinkFile) {
			continue;
		}

		const content = removeCode(await app.vault.cachedRead(backlinkFile));

		for (const annotationString of annotationStrings) {
			const escapedAnnotationString = annotationString.replace(
				/[.*+?^${}()|[\]\\]/g,
				"\\$&"
			);

			[
				// Wiki style links with annotation.
				{
					re: new RegExp(
						String.raw`${escapedAnnotationString}${optionalSpace}\!?\[\[([^\[\]]+)\]\]`,
						"g"
					),
					extractor: (matchString: string) =>
						matchString.split(/[|#]/)[0], // Removes the optional string.
				},
				// Markdown style links with annotation.
				{
					re: new RegExp(
						String.raw`${escapedAnnotationString}${optionalSpace}\!?\[[^\[\]]+\]\(([^\(\)]+)\)`,
						"g"
					),
					extractor: (matchString: string) =>
						decodeURIComponent(matchString.split("#")[0]), // Removes the optional string.
				},
			].forEach(({ re, extractor }) => {
				for (const match of content.matchAll(re)) {
					const matchedPath = app.metadataCache.getFirstLinkpathDest(
						extractor(match[1]),
						backlinkFile.path
					)?.path;
					if (matchedPath === file.path) {
						result.push({
							destinationPath: backlinkFile.path,
							annotation: annotationString,
						});
						break;
					}
				}
			});
		}
	}

	return result;
}

/**
 * Gets links from the frontmatter properties of the specified file.
 * @param app The application instance.
 * @param propertyNames The properties to search for links.
 * @param file The file to search in.
 * @param displayPropertyName The property name to use for display value.
 * @returns The array of links with their annotations.
 */
export function getPropertyLinks(
	app: App,
	propertyNames: string[],
	file: TFile,
	displayPropertyName?: string
): {
	destinationPath: string;
	annotation: string;
	propertyValue?: string | string[];
}[] {
	const result: {
		destinationPath: string;
		annotation: string;
		propertyValue?: string | string[];
	}[] = [];
	const fileCache = app.metadataCache.getFileCache(file);

	if (!fileCache?.frontmatter) {
		return result;
	}

	for (const propertyName of propertyNames) {
		if (!(propertyName in fileCache.frontmatter)) {
			continue;
		}

		const propertyValue = fileCache.frontmatter[propertyName] as unknown;
		const paths = Array.isArray(propertyValue)
			? propertyValue
			: [propertyValue];

		for (const path of paths) {
			if (!path || typeof path !== "string") continue;

			// Process wiki link format
			const { path: actualPath, displayText } = parseWikiLink(path);

			const linkedFile = app.metadataCache.getFirstLinkpathDest(
				actualPath,
				file.path
			);
			if (!linkedFile) {
				continue;
			}

			// Get the display property value from the linked file (target)
			const linkedFileCache = app.metadataCache.getFileCache(linkedFile);
			let displayValue: string | string[] | undefined;

			// First, check if there is display text
			if (displayText) {
				displayValue = displayText;
			} else {
				
			// Otherwise, check if the display property name is specified
			// Make sure we get the title from frontmatter
			if (linkedFileCache?.frontmatter && displayPropertyName) {
				if (
					displayPropertyName === "title" &&
					!linkedFileCache.frontmatter["title"]
				) {
					// If title is not in frontmatter, use the file title
					displayValue = linkedFile.basename;
				} else if (displayPropertyName in linkedFileCache.frontmatter) {
					const value = linkedFileCache.frontmatter[
						displayPropertyName
					] as unknown;
					if (
						(Array.isArray(value) &&
							value.every((v) => typeof v === "string") &&
							value.length > 0) ||
						typeof value === "string"
					) {
						displayValue = value;
					} else {
						displayValue = "";
					}
				}
			}
			}

			result.push({
				destinationPath: linkedFile.path,
				annotation: propertyName,
				propertyValue: displayValue,
			});
		}
	}

	return result;
}

// 解析 wiki 链接格式，返回实际路径和显示文本
interface WikiLinkParts {
  path: string;
  displayText?: string;
}

function parseWikiLink(path: string): WikiLinkParts {
  // 匹配 [[文件名|显示名]] 或 [[文件名]] 格式
  const wikiLinkRegex = /^\[\[([^|\]]+)(?:\|([^\]]+))?\]\]$/;
  const match = path.match(wikiLinkRegex);
  if (match) {
    return {
      path: match[1],
      displayText: match[2]  // 如果没有显示文本部分，这里会是 undefined
    };
  }
  return { path };
}
