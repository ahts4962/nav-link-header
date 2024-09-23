import { App, TFile } from "obsidian";

/**
 * Searches the annotated links from the content of the backlinks of the specified file.
 * @param app The application instance.
 * @param annotationStrings The links annotated with these strings will be searched.
 * @param file The file from which the annotated links will be searched.
 * @returns The array of the annotated links.
 */
export async function searchAnnotatedLinks(
	app: App,
	annotationStrings: string[],
	file: TFile
): Promise<{ destinationPath: string; annotation: string }[]> {
	const backlinks = Object.entries(app.metadataCache.resolvedLinks)
		.filter(([, destinations]) =>
			Object.keys(destinations).includes(file.path)
		)
		.map(([source]) => source);

	const result: { destinationPath: string; annotation: string }[] = [];

	for (const backlink of backlinks) {
		const backlinkFile = app.vault.getFileByPath(backlink);
		if (!backlinkFile) {
			continue;
		}

		let content = await app.vault.cachedRead(backlinkFile);

		// Removes YAML front matter.
		content = content.replace(/^---\n.*?(?<=\n)---(?:$|\n)/s, "");

		// Removes code blocks.
		content = content.replace(
			/(?<=(?:^|\n)) *(```+)[^`\n]*\n.*?(?<=\n) *\1`* *(?:$|\n)/gs,
			"\n"
		);
		content = content.replace(/(?<=(?:^|\n)) *```+[^`\n]*(?:$|\n.*$)/s, "");

		// Removes inline code.
		content = content.replace(
			/(`+)(?=[^`])\n?(?:[^\n]|[^\n]\n)*?(?<=[^`])\1(?=(?:$|[^`]))/gs,
			""
		);

		for (const annotationString of annotationStrings) {
			const escapedAnnotationString = annotationString.replace(
				/[.*+?^${}()|[\]\\]/g,
				"\\$&"
			);

			[
				// Wiki style links with annotation.
				{
					re: new RegExp(
						String.raw`${escapedAnnotationString}\!?\[\[([^\[\]]+)\]\]`,
						"g"
					),
					extractor: (matchString: string) =>
						matchString.split(/[|#]/)[0], // Removes the optional string.
				},
				// Markdown style links with annotation.
				{
					re: new RegExp(
						String.raw`${escapedAnnotationString}\!?\[[^\[\]]+\]\(([^\(\)]+)\)`,
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
