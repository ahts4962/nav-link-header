import { type CachedMetadata, Vault, TFile, TFolder, type TAbstractFile } from "obsidian";
import { minimatch } from "minimatch";
import type NavLinkHeader from "./main";
import { PluginComponent } from "./pluginComponent";
import type { NavLinkHeaderSettings } from "./settings";
import { deepEqual, isFileInFolder, getFirstValueFromFileProperty } from "./utils";

/**
 * Manages the lists of files in folders specified by the settings.
 * The lists also include files with extensions other than ".md".
 */
export class FolderLinksManager extends PluginComponent {
  private folderGroupEntries: FolderGroupEntry[] = [];

  public get isActive(): boolean {
    return this.folderGroupEntries.length > 0;
  }

  constructor(private plugin: NavLinkHeader) {
    super();

    for (let i = 0; i < this.plugin.settings.folderLinksSettingsArray.length; i++) {
      this.folderGroupEntries.push(new FolderGroupEntry(plugin, i));
    }
  }

  public override onFileCreated(file: TAbstractFile): void {
    if (!this.isActive) {
      return;
    }
    for (const entry of this.folderGroupEntries) {
      entry.onFileCreated(file);
    }
  }

  public override onFileDeleted(file: TAbstractFile): void {
    if (!this.isActive) {
      return;
    }
    for (const entry of this.folderGroupEntries) {
      entry.onFileDeleted(file);
    }
  }

  public override onFileRenamed(file: TAbstractFile, oldPath: string): void {
    if (!this.isActive) {
      return;
    }
    for (const entry of this.folderGroupEntries) {
      entry.onFileRenamed(file, oldPath);
    }
  }

  public override onMetadataChanged(file: TFile, data: string, cache: CachedMetadata): void {
    if (!this.isActive) {
      return;
    }
    for (const entry of this.folderGroupEntries) {
      entry.onMetadataChanged(file);
    }
  }

  public override onSettingsChanged(
    previous: NavLinkHeaderSettings,
    current: NavLinkHeaderSettings
  ): void {
    const previousLength = previous.folderLinksSettingsArray.length;
    const currentLength = current.folderLinksSettingsArray.length;
    if (previousLength > currentLength) {
      this.folderGroupEntries = this.folderGroupEntries.slice(0, currentLength);
    } else if (previousLength < currentLength) {
      const lengthDiff = currentLength - previousLength;
      const startIndex = previousLength;
      for (let i = 0; i < lengthDiff; i++) {
        this.folderGroupEntries.push(new FolderGroupEntry(this.plugin, startIndex + i));
      }
    }

    for (let i = 0; i < currentLength; i++) {
      if (i >= previousLength) {
        break;
      }
      const previousFolderSettings = previous.folderLinksSettingsArray[i];
      const currentFolderSettings = current.folderLinksSettingsArray[i];
      if (!deepEqual(previousFolderSettings, currentFolderSettings)) {
        this.folderGroupEntries[i] = new FolderGroupEntry(this.plugin, i);
      }
    }
  }

  public override dispose(): void {
    this.folderGroupEntries = [];
  }

  /**
   * Retrieves files adjacent to the specified file within the folder entries.
   * @param file The file for which to find adjacent files.
   * @returns An array of objects, each containing the previous, next, and parent file paths
   *     (if available), as well as the index of the folder group entry.
   */
  public getAdjacentFiles(file: TFile): {
    previous: string[];
    next: string[];
    parent: string[];
    index: number;
  }[] {
    if (!this.isActive) {
      return [];
    }

    const results: ReturnType<typeof this.getAdjacentFiles> = [];
    for (let i = 0; i < this.folderGroupEntries.length; i++) {
      const groupResult = this.folderGroupEntries[i].getAdjacentFiles(file);
      for (const result of groupResult) {
        results.push({
          previous: result.previous,
          next: result.next,
          parent: result.parent,
          index: i,
        });
      }
    }
    return results;
  }
}

/**
 * Represents a group of folders defined in the settings.
 * Each folder group corresponds to one entry in the `folderLinksSettingsArray` setting.
 * Each folder in the group is managed by a `FolderEntry` instance.
 * If the settings for this folder group change, a new instance of this class should be created.
 */
class FolderGroupEntry {
  private folderEntries: FolderEntry[] = [];

  constructor(private plugin: NavLinkHeader, private folderGroupIndex: number) {
    const settings = this.plugin.settings.folderLinksSettingsArray[this.folderGroupIndex];
    if (settings.folderPaths.length === 0) {
      return;
    }

    this.plugin.app.vault
      .getAllLoadedFiles()
      .filter((file) => file instanceof TFolder)
      .map((folder) => folder.path)
      .forEach((folderPath) => this.addFolderEntry(folderPath));
  }

  public onFileCreated(file: TAbstractFile): void {
    if (file instanceof TFile) {
      // Creation of `TFile` is handled in `onMetadataChanged`.
      return;
    }
    this.addFolderEntry(file.path);
  }

  public onFileDeleted(file: TAbstractFile): void {
    if (file instanceof TFile) {
      for (const entry of this.folderEntries) {
        entry.onFileDeleted(file);
      }
    } else {
      this.removeFolderEntry(file.path);
    }
  }

  public onFileRenamed(file: TAbstractFile, oldPath: string): void {
    if (file instanceof TFile) {
      for (const entry of this.folderEntries) {
        entry.onFileRenamed(file, oldPath);
      }
    } else {
      this.removeFolderEntry(oldPath);
      this.addFolderEntry(file.path);
    }
  }

  public onMetadataChanged(file: TFile): void {
    for (const entry of this.folderEntries) {
      entry.onMetadataChanged(file);
    }
  }

  /**
   * Adds a folder entry for the specified folder path if it matches the settings.
   * @param folderPath The path of the folder to add.
   */
  private addFolderEntry(folderPath: string): void {
    const index = this.folderEntries.findIndex((entry) => entry.folderPath === folderPath);
    if (index !== -1) {
      return;
    }

    const settings = this.plugin.settings.folderLinksSettingsArray[this.folderGroupIndex];

    for (const settingPath of settings.folderPaths) {
      if (!minimatch(folderPath, settingPath)) {
        continue;
      }

      let excluded = false;
      for (const excludedPath of settings.excludedFolderPaths) {
        if (minimatch(folderPath, excludedPath)) {
          excluded = true;
          break;
        }
      }
      if (!excluded) {
        this.folderEntries.push(new FolderEntry(this.plugin, this.folderGroupIndex, folderPath));
      }
      break;
    }
  }

  /**
   * Removes the folder entry for the specified folder path if it exists.
   * @param folderPath The path of the folder to remove.
   */
  private removeFolderEntry(folderPath: string): void {
    const index = this.folderEntries.findIndex((entry) => entry.folderPath === folderPath);
    if (index !== -1) {
      this.folderEntries.splice(index, 1);
    }
  }

  /**
   * Retrieves information about files adjacent to the specified file within the folder entries.
   * For each folder entry, this method checks if the given file is included and, if so, collects
   * the adjacent file information (previous, next, and parent) into the results array.
   * @param file The file for which to find adjacent files.
   * @returns An array of objects, each containing the previous, next, and parent file paths
   *     (if available).
   */
  public getAdjacentFiles(file: TFile): {
    previous: string[];
    next: string[];
    parent: string[];
  }[] {
    const results: ReturnType<typeof this.getAdjacentFiles> = [];
    for (let i = 0; i < this.folderEntries.length; i++) {
      const result = this.folderEntries[i].getAdjacentFiles(file);
      if (result.currentFileIncluded) {
        results.push({
          previous: result.previous,
          next: result.next,
          parent: result.parent,
        });
      }
    }
    return results;
  }
}

/**
 * Represents a folder defined in the settings and manages the list of files within it.
 * If the settings for this folder change, a new instance of this class should be created.
 */
class FolderEntry {
  // Sorted list of files
  private files: {
    // Normalized path to the file.
    path: string;

    // File name with extension. Used for sorting when `sortValue` is the same between files.
    fileName: string;

    // Value used for sorting. Retrieved when the file is added to the list.
    sortValue: string | number;
  }[] = [];

  /**
   * Initializes a new instance of the `FolderEntry` class.
   * @param plugin The plugin instance.
   * @param folderGroupIndex The index of the folder settings in the settings array.
   * @param folderPath The path of the folder.
   */
  constructor(
    private plugin: NavLinkHeader,
    private folderGroupIndex: number,
    public folderPath: string
  ) {
    const folder = this.plugin.app.vault.getFolderByPath(this.folderPath)!;
    if (!folder) {
      return;
    }

    Vault.recurseChildren(folder, (file) => {
      if (!(file instanceof TFile)) {
        return;
      }
      this.addFileToList(file, folder, false);
    });
    this.sortList();
  }

  public onFileDeleted(file: TFile): void {
    this.removeFileFromList(file.path);
  }

  public onFileRenamed(file: TFile, oldPath: string): void {
    this.removeFileFromList(oldPath);
    const folder = this.plugin.app.vault.getFolderByPath(this.folderPath)!;
    if (folder) {
      this.addFileToList(file, folder);
    }
  }

  public onMetadataChanged(file: TFile): void {
    // onFileCreated is not needed because onMetadataChanged is called after file creation.
    this.removeFileFromList(file.path);
    const folder = this.plugin.app.vault.getFolderByPath(this.folderPath)!;
    if (folder) {
      this.addFileToList(file, folder);
    }
  }

  /**
   * Adds the file to the list if it is included in the folder.
   * The file is filtered based on the settings.
   * @param file The file to add to the list.
   * @param folder The folder to check if the file is included in.
   * @param sort Whether to sort the list after adding the file.
   */
  private addFileToList(file: TFile, folder: TFolder, sort: boolean = true): void {
    const settings = this.plugin.settings.folderLinksSettingsArray[this.folderGroupIndex];

    // Check if the file is included in the folder.
    if (!isFileInFolder(file.path, folder.path, settings.recursive)) {
      return;
    }

    // Filter files based on the regex.
    if (settings.includePatterns.length > 0) {
      let re: RegExp | undefined = undefined;
      try {
        re = new RegExp(settings.includePatterns[0]);
      } catch {
        re = undefined;
      }

      if (re) {
        let filterValue = file.name;
        if (settings.filterBy === "property" && settings.filterPropertyName) {
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

        if (!re.test(filterValue)) {
          return;
        }
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

    if (this.files.findIndex((f) => f.path === file.path) !== -1) {
      return;
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
    const settings = this.plugin.settings.folderLinksSettingsArray[this.folderGroupIndex];

    const revert = settings.sortOrder === "desc";
    const stringComparison = this.files.some((f) => typeof f.sortValue === "string");
    this.files.sort((a, b) => {
      let result = 0;
      if (stringComparison) {
        const aSortValue = String(a.sortValue);
        const bSortValue = String(b.sortValue);
        result =
          aSortValue.localeCompare(bSortValue, undefined, { numeric: true }) ||
          a.fileName.localeCompare(b.fileName, undefined, { numeric: true });
      } else {
        if (a.sortValue < b.sortValue) {
          result = -1;
        } else if (a.sortValue > b.sortValue) {
          result = 1;
        } else {
          result = a.fileName.localeCompare(b.fileName, undefined, { numeric: true });
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
    previous: string[];
    next: string[];
    parent: string[];
  } {
    const result: ReturnType<typeof this.getAdjacentFiles> = {
      currentFileIncluded: false,
      previous: [],
      next: [],
      parent: [],
    };

    const index = this.files.findIndex((f) => f.path === file.path);
    if (index === -1) {
      return result;
    }
    result.currentFileIncluded = true;

    const settings = this.plugin.settings.folderLinksSettingsArray[this.folderGroupIndex];

    if (index > 0) {
      result.previous = [this.files[index - 1].path];
    }
    if (index < this.files.length - 1) {
      result.next = [this.files[index + 1].path];
    }
    if (settings.parentPath) {
      const parentFile = this.plugin.app.vault.getFileByPath(settings.parentPath);
      if (parentFile) {
        result.parent = [parentFile.path];
      }
    }

    return result;
  }
}
