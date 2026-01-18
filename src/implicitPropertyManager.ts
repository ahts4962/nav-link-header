import { type CachedMetadata, TFile, type TAbstractFile } from "obsidian";
import type NavLinkHeader from "./main";
import { PluginComponent } from "./pluginComponent";
import { deepEqual, getLinksFromFileProperty } from "./utils";
import type { NavLinkHeaderSettings } from "./settings";

/**
 * Manages implicit reciprocal properties between files based on the plugin settings.
 * It maintains a cache of implicit properties and updates it in response to
 * file and metadata changes.
 */
export class ImplicitPropertyManager extends PluginComponent {
  // The cache object that stores the implicit properties for files.
  // Cache structure: propertiesCache[filePath][propertyName] = propertyValues (target file paths)
  private propertiesCache: Map<string, Map<string, Set<string>>> = new Map();

  private _isActive: boolean = false;

  public get isActive(): boolean {
    return this._isActive;
  }

  private set isActive(val: boolean) {
    if (!this._isActive && val) {
      this.initializeCache();
    } else if (this._isActive && !val) {
      this.propertiesCache.clear();
    }
    this._isActive = val;
  }

  constructor(private plugin: NavLinkHeader) {
    super();

    if (this.plugin.settings.implicitReciprocalPropertyPairs.length > 0) {
      this.isActive = true;
    }
  }

  public override onFileCreated(file: TAbstractFile): void {
    if (!this.isActive || !(file instanceof TFile)) {
      return;
    }

    this.initializeCache();
  }

  public override onFileDeleted(file: TAbstractFile): void {
    if (!this.isActive || !(file instanceof TFile)) {
      return;
    }

    this.propertiesCache.delete(file.path);
    this.removeCacheEntryByFile(file);
  }

  public override onFileRenamed(file: TAbstractFile, oldPath: string): void {
    if (!this.isActive || !(file instanceof TFile)) {
      return;
    }

    this.initializeCache();
  }

  public override onMetadataResolved(): void {
    if (!this.isActive) {
      return;
    }

    this.initializeCache();
  }

  public override onMetadataChanged(file: TFile, data: string, cache: CachedMetadata): void {
    if (!this.isActive) {
      return;
    }

    this.removeCacheEntryByFile(file);
    this.addCacheEntryByFile(file, this.constructPropertyPairsMap());
  }

  public override onSettingsChanged(
    previous: NavLinkHeaderSettings,
    current: NavLinkHeaderSettings,
  ): void {
    if (this.isActive && current.implicitReciprocalPropertyPairs.length === 0) {
      this.isActive = false;
    } else if (!this.isActive && current.implicitReciprocalPropertyPairs.length > 0) {
      this.isActive = true;
    } else if (
      !deepEqual(previous.implicitReciprocalPropertyPairs, current.implicitReciprocalPropertyPairs)
    ) {
      this.initializeCache();
    }
  }

  public override dispose(): void {
    this.isActive = false;
  }

  /**
   * Initializes the properties cache by scanning all markdown files in the vault.
   */
  private initializeCache(): void {
    this.propertiesCache.clear();

    const propertyPairs = this.constructPropertyPairsMap();
    for (const file of this.plugin.app.vault.getMarkdownFiles()) {
      this.addCacheEntryByFile(file, propertyPairs);
    }
  }

  /**
   * Constructs a map of property pairs based on the plugin settings.
   * Each property is mapped to a set of its reciprocal properties.
   */
  private constructPropertyPairsMap(): Map<string, Set<string>> {
    const propertyPairs = new Map<string, Set<string>>();
    for (const pair of this.plugin.settings.implicitReciprocalPropertyPairs) {
      if (!propertyPairs.has(pair.propertyA)) {
        propertyPairs.set(pair.propertyA, new Set());
      }
      propertyPairs.get(pair.propertyA)!.add(pair.propertyB);
      if (!propertyPairs.has(pair.propertyB)) {
        propertyPairs.set(pair.propertyB, new Set());
      }
      propertyPairs.get(pair.propertyB)!.add(pair.propertyA);
    }
    return propertyPairs;
  }

  /**
   * Adds a cache entry for a file based on its property links.
   */
  private addCacheEntryByFile(file: TFile, propertyPairs: Map<string, Set<string>>): void {
    for (const [srcPropertyName, targetPropertyNames] of propertyPairs) {
      const links = getLinksFromFileProperty(this.plugin.app, file, srcPropertyName);
      if (links.length === 0) {
        continue;
      }

      for (const link of links) {
        if (link.isExternal) {
          continue;
        }

        if (!this.propertiesCache.has(link.destination)) {
          this.propertiesCache.set(link.destination, new Map());
        }
        const propertyMap = this.propertiesCache.get(link.destination)!;
        for (const targetPropertyName of targetPropertyNames) {
          if (!propertyMap.has(targetPropertyName)) {
            propertyMap.set(targetPropertyName, new Set());
          }
          propertyMap.get(targetPropertyName)!.add(file.path);
        }
      }
    }
  }

  /**
   * Removes all cache entries that reference the specified file.
   */
  private removeCacheEntryByFile(file: TFile): void {
    for (const [filePath, propertyMap] of this.propertiesCache) {
      for (const [propertyName, targetSet] of propertyMap) {
        targetSet.delete(file.path);
        if (targetSet.size === 0) {
          propertyMap.delete(propertyName);
        }
      }
      if (propertyMap.size === 0) {
        this.propertiesCache.delete(filePath);
      }
    }
  }

  /**
   * Gets the implicit property values for the specified file and property name.
   * @param file The file to get implicit property values for.
   * @param propertyName The property name to get implicit values for.
   * @returns An array of implicit property values (file paths).
   */
  public getImplicitPropertyValues(file: TFile, propertyName: string): string[] {
    if (!this.isActive) {
      return [];
    }

    const propertyMap = this.propertiesCache.get(file.path);
    if (!propertyMap) {
      return [];
    }

    const targetSet = propertyMap.get(propertyName);
    if (!targetSet) {
      return [];
    }

    return Array.from(targetSet);
  }
}
