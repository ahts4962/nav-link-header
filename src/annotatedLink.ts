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
