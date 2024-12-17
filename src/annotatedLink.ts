import { App, TFile } from "obsidian";
import { removeCode } from "./utils";
import type NavLinkHeader from "./main";

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
export async function getPropertyLinks(
	app: App,
	propertyNames: string[],
	file: TFile,
	displayPropertyName?: string
): Promise<{ destinationPath: string; annotation: string; propertyValue?: string | string[] }[]> {
	const cache = app.metadataCache.getFileCache(file);
	if (!cache?.frontmatter || propertyNames.length === 0) {
		return [];
	}

	const result: { destinationPath: string; annotation: string; propertyValue?: string | string[] }[] = [];
	const linkedFiles = app.metadataCache.resolvedLinks[file.path] || {};

	for (const propertyName of propertyNames) {
		const propertyValue = cache.frontmatter[propertyName];
		if (!propertyValue) {
			continue;
		}

		const links = Array.isArray(propertyValue)
			? propertyValue
			: [propertyValue];

		for (const link of links) {
			if (typeof link !== "string") {
				continue;
			}

			const linkedFile = app.metadataCache.getFirstLinkpathDest(
				link,
				file.path
			);
			if (!linkedFile || !linkedFiles[linkedFile.path]) {
				continue;
			}

			// Get the display property value from the linked file (target)
			const linkedFileCache = app.metadataCache.getFileCache(linkedFile);
			let displayValue: string | string[] | undefined;
			console.log('Debug getPropertyLinks:', {
				linkedFile: linkedFile.path,
				frontmatter: linkedFileCache?.frontmatter,
				displayPropertyName,
				hasProperty: linkedFileCache?.frontmatter && displayPropertyName 
					? displayPropertyName in (linkedFileCache.frontmatter || {})
					: false
			});

			// Make sure we get the title from frontmatter
			if (linkedFileCache?.frontmatter && displayPropertyName) {
				if (displayPropertyName === 'title' && !linkedFileCache.frontmatter['title']) {
					// If title is not in frontmatter, use the file title
					displayValue = linkedFile.basename;
					console.log('Using file basename as title:', displayValue);
				} else if (displayPropertyName in linkedFileCache.frontmatter) {
					const value = linkedFileCache.frontmatter[displayPropertyName];
					displayValue = value;
					console.log('Found display value in frontmatter:', displayValue);
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
