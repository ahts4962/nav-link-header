import { Vault, TFile, TAbstractFile } from "obsidian";
import type NavLinkHeader from "./main";
import { fileIncludedInFolder, getFirstValueFromFileProperty } from "./utils";

export class FolderLinksManager {
	private files: {
		path: string;
		fileName: string;
		sortValue: string | number;
	}[] = []; // Sorted list of files

	constructor(private plugin: NavLinkHeader, private folderIndex: number) {
		this.updateEntireList();
	}

	public updateEntireList(): void {
		this.files = [];

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

	public onFileModified(file: TAbstractFile): void {
		if (!(file instanceof TFile)) {
			return;
		}
		this.removeFileFromList(file.path);
		this.addFileToList(file);
	}

	/**
	 * Adds the file to the list of files if it is included in the folder.
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
				if (propertyValue === undefined || propertyValue === null) {
					sortValue = file.name;
				} else {
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
			fileName: file.name, // Used for sorting when the sortValue is the same
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
	 * previously stored with the files.
	 */
	private sortList(): void {
		const settings =
			this.plugin.settings!.folderLinksSettingsArray[this.folderIndex];

		const revert = settings.sortOrder === "desc";
		const stringComparison = this.files.some(
			(f) => typeof f.sortValue === "string"
		);
		this.files.sort((a, b) => {
			if (stringComparison) {
				const aSortValue = String(a.sortValue);
				const bSortValue = String(b.sortValue);
				const result = aSortValue.localeCompare(bSortValue);
				if (result !== 0) {
					return result * (revert ? -1 : 1);
				} else {
					return (
						a.fileName.localeCompare(b.fileName) * (revert ? -1 : 1)
					);
				}
			} else {
				if (a.sortValue < b.sortValue) {
					return -1 * (revert ? -1 : 1);
				} else if (a.sortValue > b.sortValue) {
					return 1 * (revert ? -1 : 1);
				} else {
					return (
						a.fileName.localeCompare(b.fileName) * (revert ? -1 : 1)
					);
				}
			}
		});
	}

	/**
	 * Retrieves the paths of the previous, next, and parent files of the specified file.
	 * @param file The file to retrieve the adjacent files of.
	 * @returns The paths of the previous, next, and parent files.
	 *     If the file is not found in the folder, or the corresponding settings are disabled,
	 *     the value is `undefined`.
	 */
	public getAdjacentFiles(file: TFile): {
		currentFileIncluded: boolean;
		previous?: string;
		next?: string;
		parent?: string;
	} {
		const result = {
			currentFileIncluded: false,
			previous: undefined,
			next: undefined,
			parent: undefined,
		} as ReturnType<typeof this.getAdjacentFiles>;

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
