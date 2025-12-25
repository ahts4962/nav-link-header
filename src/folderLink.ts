import { type CachedMetadata, Vault, TFile, TFolder, type TAbstractFile } from "obsidian";
import { minimatch } from "minimatch";
import type NavLinkHeader from "./main";
import type { ThreeWayDirection } from "./types";
import { PluginComponent } from "./pluginComponent";
import type { FolderLinksSettings, NavLinkHeaderSettings } from "./settings";
import {
  deepEqual,
  isFileInFolder,
  getFirstValueFromFileProperty,
  sanitizeRegexInput,
} from "./utils";

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
      this.folderGroupEntries.push(new FolderGroupEntry(this.plugin, i));
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

  public override onMetadataResolved(): void {
    if (!this.isActive) {
      return;
    }

    this.folderGroupEntries.length = 0;
    for (let i = 0; i < this.plugin.settings.folderLinksSettingsArray.length; i++) {
      this.folderGroupEntries.push(new FolderGroupEntry(this.plugin, i));
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
    this.folderGroupEntries.length = 0;
  }

  /**
   * Retrieves files adjacent to the specified file within the folder entries.
   * @param file The file for which to find adjacent files.
   * @returns An array of objects, each containing the previous, next, and parent file paths
   *     (if available), as well as the index of the folder group entry.
   */
  public getAdjacentFiles(
    file: TFile
  ): { index: number; filePaths: Record<ThreeWayDirection, string[]> }[] {
    if (!this.isActive) {
      return [];
    }

    const results: ReturnType<typeof this.getAdjacentFiles> = [];
    for (let i = 0; i < this.folderGroupEntries.length; i++) {
      const groupResult = this.folderGroupEntries[i].getAdjacentFiles(file);
      for (const adjacentFiles of groupResult) {
        results.push({ index: i, filePaths: adjacentFiles });
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
      // Creation of TFile is handled in onMetadataChanged.
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
  public getAdjacentFiles(file: TFile): Record<ThreeWayDirection, string[]>[] {
    const results: Record<ThreeWayDirection, string[]>[] = [];
    for (let i = 0; i < this.folderEntries.length; i++) {
      const adjacentFiles = this.folderEntries[i].getAdjacentFiles(file);
      if (adjacentFiles.currentFileIncluded) {
        results.push(adjacentFiles.filePaths);
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

    // Filter files based on the include patterns.
    if (settings.includePatterns.length > 0) {
      if (!this.isFileMatchingPatterns(file, settings.includePatterns, settings)) {
        return;
      }
    }

    // Filter files based on the exclude patterns.
    if (settings.excludePatterns.length > 0) {
      if (this.isFileMatchingPatterns(file, settings.excludePatterns, settings)) {
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
   * Checks if the specified file matches the include/exclude patterns in the settings.
   * @param file The file to check.
   * @param patterns The patterns to match against.
   * @param settings The folder links settings.
   * @returns `true` if the file matches any of the patterns; otherwise, `false`.
   */
  private isFileMatchingPatterns(
    file: TFile,
    patterns: string[],
    settings: FolderLinksSettings
  ): boolean {
    let valueToTest = file.name;
    if (settings.filterBy === "property" && settings.filterPropertyName.length > 0) {
      const propertyValue = getFirstValueFromFileProperty(
        this.plugin.app,
        file,
        settings.filterPropertyName
      );
      if (propertyValue === undefined || propertyValue === null) {
        return false;
      } else {
        valueToTest = String(propertyValue);
      }
    }

    for (let pattern of patterns) {
      if (!settings.enableRegex) {
        pattern = sanitizeRegexInput(pattern);
      }
      let re: RegExp;
      try {
        re = new RegExp(pattern);
      } catch {
        continue;
      }

      if (re.test(valueToTest)) {
        return true;
      }
    }
    return false;
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
   *     the other values are empty arrays.
   *     If previous, next, or parent files are not found,
   *     the corresponding value is an empty array.
   */
  public getAdjacentFiles(file: TFile): {
    currentFileIncluded: boolean;
    filePaths: Record<ThreeWayDirection, string[]>;
  } {
    const result: ReturnType<typeof this.getAdjacentFiles> = {
      currentFileIncluded: false,
      filePaths: { previous: [], next: [], parent: [] },
    };

    const index = this.files.findIndex((f) => f.path === file.path);
    if (index === -1) {
      return result;
    }
    result.currentFileIncluded = true;

    const settings = this.plugin.settings.folderLinksSettingsArray[this.folderGroupIndex];

    for (
      let i = index - 1, remaining = settings.maxLinks;
      i >= 0 && remaining > 0;
      i--, remaining--
    ) {
      result.filePaths.previous.unshift(this.files[i].path);
    }

    for (
      let i = index + 1, remaining = settings.maxLinks;
      i < this.files.length && remaining > 0;
      i++, remaining--
    ) {
      result.filePaths.next.push(this.files[i].path);
    }

    if (settings.parentPath) {
      const parentFile = this.plugin.app.vault.getFileByPath(settings.parentPath);
      if (parentFile) {
        result.filePaths.parent = [parentFile.path];
      }
    }

    return result;
  }
}
