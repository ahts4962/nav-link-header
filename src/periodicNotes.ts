import { type Moment } from "moment";
import { normalizePath, TAbstractFile, TFile } from "obsidian";
import {
	appHasDailyNotesPluginLoaded,
	appHasWeeklyNotesPluginLoaded,
	appHasMonthlyNotesPluginLoaded,
	appHasQuarterlyNotesPluginLoaded,
	appHasYearlyNotesPluginLoaded,
	getPeriodicNoteSettings,
	getDateFromPath,
	getDateUID,
	getAllDailyNotes,
	getAllWeeklyNotes,
	getAllMonthlyNotes,
	getAllQuarterlyNotes,
	getAllYearlyNotes,
	createDailyNote,
	createWeeklyNote,
	createMonthlyNote,
	createQuarterlyNote,
	createYearlyNote,
	type IGranularity,
} from "obsidian-daily-notes-interface";
import NavLinkHeader from "./main";
import type { NavLinkHeaderSettings } from "./settings";
import { fileIncludedInFolder, joinPaths } from "./utils";

const ALL_GRANULARITIES: IGranularity[] = [
	"day",
	"week",
	"month",
	"quarter",
	"year",
];

/**
 * Returns the granularities that are active (corresponding settings enabled).
 * @param settings The settings of the plugin.
 * @param cacheRequiredOnly If `true`, only the granularities that require note cache
 *     will be returned.
 *     For example, if `prevNextLinksEnabledInMonthlyNotes` is `false` and
 *     `parentLinkGranularityInMonthlyNotes` is "year" and "month" is not referenced
 *     as parent from any other granularities, monthly notes do not require caching, while
 *     Periodic Notes settings must be enabled for monthly notes to determine if
 *     a particular note is a monthly note.
 *     In this case, if `cacheRequiredOnly` is `true`, "month" will not be returned.
 * @returns The active granularities.
 */
export function getActiveGranularities(
	settings: NavLinkHeaderSettings,
	cacheRequiredOnly: boolean
): IGranularity[] {
	const periodicNotesSettingFunctions = {
		day: appHasDailyNotesPluginLoaded,
		week: appHasWeeklyNotesPluginLoaded,
		month: appHasMonthlyNotesPluginLoaded,
		quarter: appHasQuarterlyNotesPluginLoaded,
		year: appHasYearlyNotesPluginLoaded,
	};
	const usedForParent = new Set(
		[
			settings.parentLinkGranularityInDailyNotes,
			settings.parentLinkGranularityInWeeklyNotes,
			settings.parentLinkGranularityInMonthlyNotes,
			settings.parentLinkGranularityInQuarterlyNotes,
		].filter((value) => value != undefined)
	);

	if (cacheRequiredOnly) {
		return ALL_GRANULARITIES.filter((granularity) => {
			return (
				periodicNotesSettingFunctions[granularity]() &&
				(getPrevNextLinkEnabledSetting(settings, granularity) ||
					usedForParent.has(granularity))
			);
		});
	} else {
		return ALL_GRANULARITIES.filter((granularity) => {
			return (
				periodicNotesSettingFunctions[granularity]() &&
				(getPrevNextLinkEnabledSetting(settings, granularity) ||
					getParentLinkGranularitySetting(settings, granularity) ||
					usedForParent.has(granularity))
			);
		});
	}
}

export function getPrevNextLinkEnabledSetting(
	settings: NavLinkHeaderSettings,
	granularity: IGranularity
): boolean {
	return {
		day: settings.prevNextLinksEnabledInDailyNotes,
		week: settings.prevNextLinksEnabledInWeeklyNotes,
		month: settings.prevNextLinksEnabledInMonthlyNotes,
		quarter: settings.prevNextLinksEnabledInQuarterlyNotes,
		year: settings.prevNextLinksEnabledInYearlyNotes,
	}[granularity];
}

export function getParentLinkGranularitySetting(
	settings: NavLinkHeaderSettings,
	granularity: IGranularity
): IGranularity | undefined {
	return {
		day: settings.parentLinkGranularityInDailyNotes,
		week: settings.parentLinkGranularityInWeeklyNotes,
		month: settings.parentLinkGranularityInMonthlyNotes,
		quarter: settings.parentLinkGranularityInQuarterlyNotes,
		year: undefined,
	}[granularity];
}

function getAllPeriodicNotes(granularity: IGranularity): Record<string, TFile> {
	return {
		day: getAllDailyNotes,
		week: getAllWeeklyNotes,
		month: getAllMonthlyNotes,
		quarter: getAllQuarterlyNotes,
		year: getAllYearlyNotes,
	}[granularity]();
}

export function createPeriodicNote(
	granularity: IGranularity,
	date: Moment
): Promise<TFile> {
	return {
		day: createDailyNote,
		week: createWeeklyNote,
		month: createMonthlyNote,
		quarter: createQuarterlyNote,
		year: createYearlyNote,
	}[granularity](date);
}

export class PeriodicNotesManager {
	private noteCache: Map<IGranularity, Record<string, TFile>> = new Map();

	// Sorted keys of the noteCache.
	private noteUIDCache: Map<IGranularity, string[]> = new Map();

	constructor(private plugin: NavLinkHeader) {
		this.updateEntireCache();
	}

	public updateEntireCache(): void {
		const granularities = getActiveGranularities(
			this.plugin.settings!,
			true
		);
		this.noteCache.clear();
		this.noteUIDCache.clear();
		for (const granularity of granularities) {
			const allNotes = getAllPeriodicNotes(granularity);
			this.noteCache.set(granularity, allNotes);
			this.noteUIDCache.set(granularity, Object.keys(allNotes).sort());
		}
	}

	public onFileCreated(file: TAbstractFile): void {
		if (!(file instanceof TFile)) {
			return;
		}
		this.addNoteToCache(file);
	}

	public onFileDeleted(file: TAbstractFile): void {
		if (!(file instanceof TFile)) {
			return;
		}
		this.removeNoteFromCache(file.path);
	}

	public onFileRenamed(file: TAbstractFile, oldPath: string): void {
		if (!(file instanceof TFile)) {
			return;
		}
		this.removeNoteFromCache(oldPath);
		this.addNoteToCache(file);
	}

	/**
	 * Adds the note to the cache if it is a periodic note.
	 */
	private addNoteToCache(file: TFile): void {
		const { date, granularity } = this.getDateFromPath(file.path);
		if (!date || !granularity) {
			return;
		}
		const notes = this.noteCache.get(granularity);
		const uids = this.noteUIDCache.get(granularity);
		if (notes && uids) {
			const dateUID = getDateUID(date, granularity);
			notes[dateUID] = file;
			uids.push(dateUID);
			uids.sort();
		}
	}

	/**
	 * Removes the note from the cache if it is a periodic note.
	 */
	private removeNoteFromCache(path: string): void {
		const { date, granularity } = this.getDateFromPath(path);
		if (!date || !granularity) {
			return;
		}
		const notes = this.noteCache.get(granularity);
		const uids = this.noteUIDCache.get(granularity);
		if (notes && uids) {
			const dateUID = getDateUID(date, granularity);
			delete notes[dateUID];
			const index = uids.indexOf(dateUID);
			if (index !== -1) {
				uids.splice(index, 1);
			}
		}
	}

	/**
	 * Searches for the adjacent notes of the specified file.
	 * @returns `currentGranularity` is the granularity of the current note.
	 * If the note is not a periodic note, `currentGranularity` is `undefined`.
	 * `previousPath`, `nextPath`, and `parentPath` are the paths to the previous, next,
	 * and parent notes, respectively. If not found, `undefined` is returned for each.
	 * If `parentDate` is not `undefined`, it means that the parent note does not exist,
	 * but can be created by using this date (`parentPath` is also available).
	 * `parentGranularity` is the granularity of the parent note.
	 */
	public searchAdjacentNotes(file: TFile): {
		currentGranularity?: IGranularity;
		previousPath?: string;
		nextPath?: string;
		parentPath?: string;
		parentDate?: Moment;
		parentGranularity?: IGranularity;
	} {
		const result = {
			currentGranularity: undefined,
			previousPath: undefined,
			nextPath: undefined,
			parentPath: undefined,
			parentDate: undefined,
			parentGranularity: undefined,
		} as ReturnType<typeof this.searchAdjacentNotes>;

		const { date, granularity } = this.getDateFromPath(file.path);
		if (!date || !granularity) {
			return result;
		}
		result.currentGranularity = granularity;

		if (getPrevNextLinkEnabledSetting(this.plugin.settings!, granularity)) {
			const allNotes = this.noteCache.get(granularity)!;
			const uids = this.noteUIDCache.get(granularity)!;
			const dateUID = getDateUID(date, granularity);
			const index = uids.indexOf(dateUID);

			result.previousPath =
				index > 0 ? allNotes[uids[index - 1]].path : undefined;
			result.nextPath =
				index < uids.length - 1
					? allNotes[uids[index + 1]].path
					: undefined;
		}

		const parentGranularity = getParentLinkGranularitySetting(
			this.plugin.settings!,
			granularity
		);
		if (!parentGranularity) {
			return result;
		}
		result.parentGranularity = parentGranularity;

		const allParentNotes = this.noteCache.get(parentGranularity);
		if (!allParentNotes) {
			return result;
		}

		const parentUID = getDateUID(date, parentGranularity);
		const parentNote = allParentNotes[parentUID];
		if (parentNote) {
			result.parentPath = parentNote.path;
		} else {
			const { format, folder } =
				getPeriodicNoteSettings(parentGranularity);
			let fileName = date.format(format);
			if (!fileName.endsWith(".md")) {
				fileName += ".md";
			}
			result.parentPath = joinPaths(folder ?? "/", fileName);
			result.parentDate = date;
		}

		return result;
	}

	/**
	 * Returns the corresponding date of the file if the path is valid as a periodic note.
	 * It doesn't matter if the file actually exists.
	 * @param path The normalized path to the file.
	 * @returns The date and granularity of the file if it is a periodic note.
	 *     If the file is not a periodic note, `undefined` is returned for both values.
	 */
	private getDateFromPath(path: string): {
		date?: Moment;
		granularity?: IGranularity;
	} {
		const granularities = getActiveGranularities(
			this.plugin.settings!,
			false
		);
		for (const granularity of granularities) {
			const { folder } = getPeriodicNoteSettings(granularity);
			const periodicNotesFolder = normalizePath(folder ?? "/");
			if (!fileIncludedInFolder(path, periodicNotesFolder)) {
				continue;
			}
			const date = getDateFromPath(path, granularity);
			if (date) {
				return { date, granularity };
			}
		}
		return { date: undefined, granularity: undefined };
	}
}
