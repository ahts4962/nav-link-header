import { type TAbstractFile, TFile } from "obsidian";
import type NavLinkHeader from "./main";
import { removeCode, removeVariationSelectors } from "./utils";

/**
 * Manages the annotated links.
 * This class is used to search annotated links and cache the search results.
 * If the settings related to annotated links are changed, the instance must be re-created.
 */
export class AnnotatedLinksManager {
	// The cache object that stores the result of annotated links search.
	// Cache structure: cache[backlinkFilePath][currentFilePath] = [annotation1, annotation2, ...]
	private cache: Map<string, Map<string, string[]>> = new Map();

	constructor(private plugin: NavLinkHeader) {}

	public onFileDeleted(file: TAbstractFile): void {
		if (!(file instanceof TFile)) {
			return;
		}
		this.removeFileFromCache(file.path);
	}

	public onFileRenamed(file: TAbstractFile, oldPath: string): void {
		if (!(file instanceof TFile)) {
			return;
		}
		this.removeFileFromCache(oldPath);
	}

	public onFileModified(file: TAbstractFile): void {
		if (!(file instanceof TFile)) {
			return;
		}
		this.removeFileFromCache(file.path);
	}

	private removeFileFromCache(filePath: string): void {
		if (this.cache.has(filePath)) {
			this.cache.delete(filePath);
		}
	}

	/**
	 * Searches the annotated links from the content of the backlinks of the specified file.
	 * @param file Annotated links are searched from the backlinks of this file.
	 * @returns Return annotated links asynchronously, one at a time.
	 */
	public async *searchAnnotatedLinks(
		file: TFile
	): AsyncGenerator<{ destinationPath: string; annotation: string }> {
		const backlinks = Object.entries(
			this.plugin.app.metadataCache.resolvedLinks
		)
			.filter(([, destinations]) =>
				Object.keys(destinations).includes(file.path)
			)
			.map(([source]) => source);

		const annotationStrings = this.plugin.settings!.annotationStrings;
		const allowSpace =
			this.plugin.settings!.allowSpaceAfterAnnotationString;

		for (const backlink of backlinks) {
			const cachedResult = this.cache.get(backlink)?.get(file.path);
			if (cachedResult) {
				for (const annotation of cachedResult) {
					yield { destinationPath: backlink, annotation };
				}
				continue;
			}

			const backlinkFile = this.plugin.app.vault.getFileByPath(backlink);
			if (!backlinkFile) {
				continue;
			}

			let content = removeCode(
				await this.plugin.app.vault.cachedRead(backlinkFile)
			);

			const ignoreVariationSelectors =
				this.plugin.settings!.ignoreVariationSelectors;
			if (ignoreVariationSelectors) {
				content = removeVariationSelectors(content);
			}

			const detectedAnnotations: string[] = [];
			for (const annotation of annotationStrings) {
				let annotationForActualSearch = annotation;
				if (ignoreVariationSelectors) {
					annotationForActualSearch = removeVariationSelectors(
						annotationForActualSearch
					);
					if (annotationForActualSearch === "") {
						continue;
					}
				}

				if (
					this.searchAnnotatedLinkInContent(
						content,
						backlink,
						file.path,
						annotationForActualSearch,
						allowSpace
					)
				) {
					detectedAnnotations.push(annotationForActualSearch);
					yield {
						destinationPath: backlink,
						annotation: annotationForActualSearch,
					};
				}
			}

			if (!this.cache.has(backlink)) {
				this.cache.set(backlink, new Map());
			}
			this.cache.get(backlink)!.set(file.path, detectedAnnotations);
		}
	}

	/**
	 * Helper function for `searchAnnotatedLinks`.
	 * @param content The content to search in.
	 * @param backlinkFilePath The path of the backlink file.
	 * @param filePath The path of the file to search for.
	 * @param annotationString The annotation string to search for.
	 * @param allowSpace Whether to allow space after the annotation string.
	 * @returns Whether the annotated link is found in the content.
	 */
	private searchAnnotatedLinkInContent(
		content: string,
		backlinkFilePath: string,
		filePath: string,
		annotationString: string,
		allowSpace: boolean
	): boolean {
		const optionalSpace = allowSpace ? " ?" : "";
		const escapedAnnotationString = annotationString.replace(
			/[.*+?^${}()|[\]\\]/g,
			"\\$&"
		);
		const configs = [
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
				extractor: (matchString: string) => {
					matchString = matchString.split("#")[0]; // Removes the optional string.
					try {
						return decodeURIComponent(matchString);
					} catch {
						return matchString; // Fallback to raw string if decoding fails.
					}
				},
			},
		];

		for (const { re, extractor } of configs) {
			for (const match of content.matchAll(re)) {
				const matchedPath =
					this.plugin.app.metadataCache.getFirstLinkpathDest(
						extractor(match[1]),
						backlinkFilePath
					)?.path;
				if (matchedPath === filePath) {
					return true;
				}
			}
		}

		return false;
	}
}
