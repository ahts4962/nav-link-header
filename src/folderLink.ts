import { Vault, TFile, type TAbstractFile } from "obsidian";
import type NavLinkHeader from "./main";
import { fileIncludedInFolder, getFirstValueFromFileProperty } from "./utils";

/**
 * Manages the list of files in a folder specified by the settings.
 * This list includes files with extensions other than ".md".
 * The instance must be re-created when the settings are changed.
 */
export class FolderLinksManager {
	// Sorted list of files
	private files: {
		// Normalized path to the file.
		path: string;

		// File name with extension.
		// Used for sorting when `sortValue` is the same between files.
		fileName: string;

		// Value used for sorting.
		// Retrieved when the file is added to the list.
		sortValue: string | number;
	}[] = [];

	/**
	 * Initializes a new instance of the `FolderLinksManager` class.
	 * @param plugin The plugin instance.
	 * @param folderIndex The index of the folder settings in the settings array.
	 */
	constructor(private plugin: NavLinkHeader, private folderIndex: number) {
		const settings =
			this.plugin.settings!.folderLinksSettingsArray[this.folderIndex];
		if (!settings.folderPath) {
			return;
		}
		const folder = this.plugin.app.vault.getFolderByPath(
			settings.folderPath
		);
		if (!folder) {
			return;
		}

		Vault.recurseChildren(folder, (file) => {
			if (!(file instanceof TFile)) {
				return;
			}
			this.addFileToList(file, false);
		});
		this.sortList();
	}

	public onFileCreated(file: TAbstractFile): void {
		if (!(file instanceof TFile)) {
			return;
		}
		this.addFileToList(file);
	}

	public onFileDeleted(file: TAbstractFile): void {
		if (!(file instanceof TFile)) {
			return;
		}
		this.removeFileFromList(file.path);
	}

	public onFileRenamed(file: TAbstractFile, oldPath: string): void {
		if (!(file instanceof TFile)) {
			return;
		}
		this.removeFileFromList(oldPath);
		this.addFileToList(file);
	}

	/**
	 * Called when a file is modified.
	 * This event handler is necessary to detect changes in the file properties.
	 */
	public onFileModified(file: TAbstractFile): void {
		if (!(file instanceof TFile)) {
			return;
		}
		this.removeFileFromList(file.path);
		this.addFileToList(file);
	}

	/**
	 * Adds the file to the list if it is included in the folder.
	 * The file is filtered based on the settings.
	 * @param file The file to add to the list.
	 * @param sort Whether to sort the list after adding the file.
	 */
	private addFileToList(file: TFile, sort: boolean = true): void {
		const settings =
			this.plugin.settings!.folderLinksSettingsArray[this.folderIndex];

		// Check if the file is included in the folder.
		if (!settings.folderPath) {
			return;
		}
		const folder = this.plugin.app.vault.getFolderByPath(
			settings.folderPath
		);
		if (!folder) {
			return;
		}

		if (!fileIncludedInFolder(file.path, folder.path, settings.recursive)) {
			return;
		}

		// Filter files based on the regex.
		if (settings.filterRegex) {
			let filterValue = file.name;
			if (
				settings.filterBy === "property" &&
				settings.filterPropertyName
			) {
				const propertyValue = getFirstValueFromFileProperty(
					this.plugin.app,
					file,
					settings.filterPropertyName
				);
				if (propertyValue === undefined || propertyValue === null) {
					return;
				} else {
					filterValue = String(propertyValue);
				}
			}

			const re = new RegExp(settings.filterRegex);
			if (!re.test(filterValue)) {
				return;
			}
		}

		// Retrieve and store the values used for sorting in advance.
		let sortValue: string | number = file.name;
		if (settings.sortBy === "created") {
			sortValue = file.stat.ctime;
		} else if (settings.sortBy === "modified") {
			sortValue = file.stat.mtime;
		} else if (settings.sortBy === "property") {
			if (settings.sortPropertyName) {
				const propertyValue = getFirstValueFromFileProperty(
					this.plugin.app,
					file,
					settings.sortPropertyName
				);
				if (propertyValue !== undefined && propertyValue !== null) {
					if (typeof propertyValue === "boolean") {
						sortValue = propertyValue ? 1 : 0;
					} else {
						sortValue = propertyValue;
					}
				}
			}
		}

		this.files.push({
			path: file.path,
			fileName: file.name,
			sortValue: sortValue,
		});

		if (sort) {
			this.sortList();
		}
	}

	/**
	 * Removes the file from the list of files if it exists.
	 */
	private removeFileFromList(path: string): void {
		const index = this.files.findIndex((f) => f.path === path);
		if (index !== -1) {
			this.files.splice(index, 1);
		}
	}

	/**
	 * Sorts the list of files based on the settings and the values
	 * previously stored with the file paths.
	 */
	private sortList(): void {
		const settings =
			this.plugin.settings!.folderLinksSettingsArray[this.folderIndex];

		const revert = settings.sortOrder === "desc";
		const stringComparison = this.files.some(
			(f) => typeof f.sortValue === "string"
		);
		this.files.sort((a, b) => {
			let result = 0;
			if (stringComparison) {
				const aSortValue = String(a.sortValue);
				const bSortValue = String(b.sortValue);
				result =
					aSortValue.localeCompare(bSortValue) ||
					a.fileName.localeCompare(b.fileName);
			} else {
				if (a.sortValue < b.sortValue) {
					result = -1;
				} else if (a.sortValue > b.sortValue) {
					result = 1;
				} else {
					result = a.fileName.localeCompare(b.fileName);
				}
			}
			return revert ? -result : result;
		});
	}

	/**
	 * Retrieves the paths of the previous, next, and parent files of the specified file.
	 * @param file The file to retrieve the adjacent files of.
	 * @returns The paths of the previous, next, and parent files.
	 *     If `file` is not included in the folder, `currentFileIncluded` is `false` and
	 *     the other values are `undefined`.
	 *     If previous, next, or parent files are not found, the corresponding value is `undefined`.
	 */
	public getAdjacentFiles(file: TFile): {
		currentFileIncluded: boolean;
		previous?: string;
		next?: string;
		parent?: string;
	} {
		const result: ReturnType<typeof this.getAdjacentFiles> = {
			currentFileIncluded: false,
			previous: undefined,
			next: undefined,
			parent: undefined,
		};

		const index = this.files.findIndex((f) => f.path === file.path);
		if (index === -1) {
			return result;
		}
		result.currentFileIncluded = true;

		const settings =
			this.plugin.settings!.folderLinksSettingsArray[this.folderIndex];

		if (index > 0) {
			result.previous = this.files[index - 1].path;
		}
		if (index < this.files.length - 1) {
			result.next = this.files[index + 1].path;
		}
		if (settings.parentPath) {
			const parentFile = this.plugin.app.vault.getFileByPath(
				settings.parentPath
			);
			if (parentFile) {
				result.parent = parentFile.path;
			}
		}

		return result;
	}
}
