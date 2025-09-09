import type { HoverParent, TAbstractFile, WorkspaceWindow } from "obsidian";
import type { NavLinkHeaderSettings } from "./settings";

/**
 * Represents the main component for the plugin, providing lifecycle hooks and event handlers
 * for file operations, window events, navigation updates, and settings changes.
 */
export abstract class PluginComponent {
  /**
   * Called when a new file is created in the vault.
   * @param file The newly created file.
   */
  public onFileCreated(file: TAbstractFile): void {}

  /**
   * Called when a file is deleted from the vault.
   * @param file The deleted file.
   */
  public onFileDeleted(file: TAbstractFile): void {}

  /**
   * Called when a file is renamed in the vault.
   * @param file The renamed file.
   * @param oldPath The previous path of the file before renaming.
   */
  public onFileRenamed(file: TAbstractFile, oldPath: string): void {}

  /**
   * Called when a file is modified in the vault.
   * @param file The modified file.
   */
  public onFileModified(file: TAbstractFile): void {}

  /**
   * Called when a new workspace window is opened.
   * @param window The opened workspace window.
   */
  public onWindowOpen(window: WorkspaceWindow): void {}

  /**
   * Called when a workspace window is closed.
   * @param window The closed workspace window.
   */
  public onWindowClose(window: WorkspaceWindow): void {}

  /**
   * Called when a link is hovered over.
   * @param hoverParent The parent component of the hover popover.
   */
  public onHoverLink(hoverParent: HoverParent): void {}

  /**
   * Called when a navigation update is required.
   */
  public onNavigationUpdateRequired(): void {}

  /**
   * Called when a forced navigation update is required.
   */
  public onForcedNavigationUpdateRequired(): void {}

  /**
   * Called when the plugin settings have changed.
   * @param previous The previous settings.
   * @param current The current settings.
   */
  public onSettingsChanged(previous: NavLinkHeaderSettings, current: NavLinkHeaderSettings): void {}

  /**
   * Disposes of the component and releases any resources.
   */
  public dispose(): void {}
}
