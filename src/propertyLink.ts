import { App, TFile } from "obsidian";
import NavLinkHeader from "./main";
import { getStringValuesFromFileProperty, parseWikiLink } from "./utils";

/**
 * Gets links from the frontmatter properties of the specified file.
 * @param app The application instance.
 * @param propertyNames The properties to search for links.
 * @param file The file to search in.
 * @param displayPropertyName The property name to use for display value.
 * @returns The array of links with their annotations.
 */
export function getPropertyLinks(
	plugin: NavLinkHeader,
	file: TFile
): {
	destinationPath: string;
	prefix: string;
	displayText?: string;
}[] {
	const result: {
		destinationPath: string;
		prefix: string;
		displayText?: string;
	}[] = [];

	const propertyMappings = plugin.settings!.propertyMappings;
	for (const { property, prefix } of propertyMappings) {
		const links = getLinksFromFileProperty(plugin.app, file, property);

		for (const { destinationPath, displayText } of links) {
			result.push({
				destinationPath,
				prefix,
				displayText,
			});
		}
	}

	return result;
}

/**
 * Gets the three-way link from the frontmatter properties of the specified file.
 * @param app The application instance.
 * @param file The file to search in.
 * @returns The three-way link.
 */
export function getThreeWayPropertyLink(
	plugin: NavLinkHeader,
	file: TFile
): {
	previous?: { destinationPath: string; displayText?: string };
	next?: { destinationPath: string; displayText?: string };
	parent?: { destinationPath: string; displayText?: string };
} {
	const result: Record<
		string,
		{ destinationPath: string; displayText?: string } | undefined
	> = {};
	for (const [key, property] of [
		["previous", plugin.settings!.previousLinkProperty],
		["next", plugin.settings!.nextLinkProperty],
		["parent", plugin.settings!.parentLinkProperty],
	]) {
		result[key] = undefined;
		if (property) {
			const links = getLinksFromFileProperty(plugin.app, file, property);
			if (links.length > 0) {
				result[key] = links[0];
			}
		}
	}

	return result;
}

/**
 * Gets the links to the files specified in the file property.
 * @param app The application instance.
 * @param file The file to search in.
 * @param propertyName The name of the property to search for links.
 * @returns The array of links with their display text.
 *     If the property does not exist or valid links are not found, an empty array is returned.
 */
function getLinksFromFileProperty(
	app: App,
	file: TFile,
	propertyName: string
): {
	destinationPath: string;
	displayText?: string;
}[] {
	const propertyValues = getStringValuesFromFileProperty(
		app,
		file,
		propertyName
	);

	const result: {
		destinationPath: string;
		displayText?: string;
	}[] = [];
	for (const value of propertyValues) {
		let path = value;
		let displayText: string | undefined = undefined;

		const parsed = parseWikiLink(value);
		if (parsed.path) {
			path = parsed.path;
		}

		const linkedFile = app.metadataCache.getFirstLinkpathDest(
			path,
			file.path
		);
		if (!linkedFile) {
			continue;
		}

		if (parsed.displayText) {
			displayText = parsed.displayText;
		}

		result.push({
			destinationPath: linkedFile.path,
			displayText,
		});
	}

	return result;
}
