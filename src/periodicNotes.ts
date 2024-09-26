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
import type NavLinkHeader from "./main";
import { fileIncludedInFolder, joinPaths } from "./utils";

const ALL_GRANULARITIES: IGranularity[] = [
	"day",
	"week",
	"month",
	"quarter",
	"year",
];

export function getActiveGranularities(plugin: NavLinkHeader): IGranularity[] {
	const settings = plugin.settings;
	if (!settings) {
		return [];
	}
	const periodicNotesSettingFunctions = {
		day: appHasDailyNotesPluginLoaded,
		week: appHasWeeklyNotesPluginLoaded,
		month: appHasMonthlyNotesPluginLoaded,
		quarter: appHasQuarterlyNotesPluginLoaded,
		year: appHasYearlyNotesPluginLoaded,
	};
	const pluginSettings = {
		day: settings.dailyNoteLinksEnabled,
		week: settings.weeklyNoteLinksEnabled,
		month: settings.monthlyNoteLinksEnabled,
		quarter: settings.quarterlyNoteLinksEnabled,
		year: settings.yearlyNoteLinksEnabled,
	};
	return ALL_GRANULARITIES.filter((granularity) => {
		return (
			periodicNotesSettingFunctions[granularity]() &&
			pluginSettings[granularity]
		);
	});
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
		const granularities = this.getActiveGranularities();
		this.noteCache.clear();
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
		const values = this.getDateFromPath(file.path);
		if (!values) {
			return;
		}
		const { date, granularity } = values;
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
		const values = this.getDateFromPath(path);
		if (!values) {
			return;
		}
		const { date, granularity } = values;
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
	 * @returns `previousPath`, `nextPath`, and `upPath` are the paths to the previous, next,
	 * and up notes, respectively. If there is no data to display, an empty string is returned.
	 * If `upDate` is not `undefined`, it means that the up note does not exist, and the path and
	 * date can be used to create a new note.
	 */
	public searchAdjacentNotes(file: TFile):
		| {
				previousPath: string;
				nextPath: string;
				upPath: string;
				upDate: Moment | undefined;
				upGranularity: IGranularity | undefined;
		  }
		| undefined {
		const values = this.getDateFromPath(file.path);
		if (!values) {
			return undefined;
		}
		const { date, granularity } = values;

		const allNotes = this.noteCache.get(granularity);
		const uids = this.noteUIDCache.get(granularity);
		if (!allNotes || !uids) {
			return undefined;
		}

		const dateUID = getDateUID(date, granularity);
		const index = uids.indexOf(dateUID);
		if (index === -1) {
			return undefined;
		}

		const previousPath = index > 0 ? allNotes[uids[index - 1]].path : "";
		const nextPath =
			index < uids.length - 1 ? allNotes[uids[index + 1]].path : "";

		const upGranularity = this.getNextActiveGranularity(granularity);
		let upPath = "";
		let upDate: Moment | undefined;
		if (upGranularity) {
			const upAllNotes = this.noteCache.get(upGranularity);
			const upUID = getDateUID(date, upGranularity);
			const upNote = upAllNotes?.[upUID];
			if (upNote) {
				upPath = upNote.path;
			} else {
				const { format, folder } =
					getPeriodicNoteSettings(upGranularity);
				let fileName = date.format(format);
				if (!fileName.endsWith(".md")) {
					fileName += ".md";
				}
				upPath = joinPaths(folder ?? "/", fileName);
				upDate = date;
			}
		}

		return {
			previousPath,
			nextPath,
			upPath,
			upDate,
			upGranularity,
		};
	}

	/**
	 * Returns the corresponding date of the file if the path is valid as a periodic note.
	 * It doesn't matter if the file actually exists.
	 * @param path The normalized path to the file.
	 */
	private getDateFromPath(
		path: string
	): { date: Moment; granularity: IGranularity } | undefined {
		const granularities = this.getActiveGranularities();
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
		return undefined;
	}

	private getNextActiveGranularity(
		granularity: IGranularity
	): IGranularity | undefined {
		const granularities = this.getActiveGranularities();
		const index = granularities.indexOf(granularity);
		if (index === -1 || index === granularities.length - 1) {
			return undefined;
		}
		return granularities[index + 1];
	}

	private getActiveGranularities(): IGranularity[] {
		return getActiveGranularities(this.plugin);
	}
}
