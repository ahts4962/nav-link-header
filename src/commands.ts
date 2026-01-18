import type { TFile } from "obsidian";
import type NavLinkHeader from "./main";
import type { ThreeWayDirection } from "./types";
import { PeriodicNotesManager } from "./periodicNotes";
import { getThreeWayPropertyLink } from "./propertyLink";
import { FolderLinksManager } from "./folderLink";
import { openExternalLink } from "./utils";

/**
 * Adds commands to the plugin.
 * @param plugin The plugin instance.
 */
export function addCommands(plugin: NavLinkHeader): void {
  plugin.addCommand({
    id: "open-previous-property-link",
    name: "Open previous property link",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }
      return openThreeWayPropertyLink(plugin, file, "previous", checking);
    },
  });

  plugin.addCommand({
    id: "open-next-property-link",
    name: "Open next property link",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }
      return openThreeWayPropertyLink(plugin, file, "next", checking);
    },
  });

  plugin.addCommand({
    id: "open-parent-property-link",
    name: "Open parent property link",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }
      return openThreeWayPropertyLink(plugin, file, "parent", checking);
    },
  });

  plugin.addCommand({
    id: "open-previous-periodic-note",
    name: "Open previous periodic note",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }
      return openPeriodicNote(plugin, file, "previous", checking);
    },
  });

  plugin.addCommand({
    id: "open-next-periodic-note",
    name: "Open next periodic note",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }
      return openPeriodicNote(plugin, file, "next", checking);
    },
  });

  plugin.addCommand({
    id: "open-parent-periodic-note",
    name: "Open parent periodic note",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }
      return openPeriodicNote(plugin, file, "parent", checking);
    },
  });

  plugin.addCommand({
    id: "open-previous-folder-link",
    name: "Open previous folder link",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }
      return openFolderLink(plugin, file, "previous", checking);
    },
  });

  plugin.addCommand({
    id: "open-next-folder-link",
    name: "Open next folder link",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }
      return openFolderLink(plugin, file, "next", checking);
    },
  });

  plugin.addCommand({
    id: "open-parent-folder-link",
    name: "Open parent folder link",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }
      return openFolderLink(plugin, file, "parent", checking);
    },
  });

  plugin.addCommand({
    id: "open-previous-note",
    name: "Open previous link (for any type)",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }

      if (openThreeWayPropertyLink(plugin, file, "previous", checking)) {
        return true;
      }

      if (openPeriodicNote(plugin, file, "previous", checking)) {
        return true;
      }

      if (openFolderLink(plugin, file, "previous", checking)) {
        return true;
      }

      return false;
    },
  });

  plugin.addCommand({
    id: "open-next-note",
    name: "Open next link (for any type)",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }

      if (openThreeWayPropertyLink(plugin, file, "next", checking)) {
        return true;
      }

      if (openPeriodicNote(plugin, file, "next", checking)) {
        return true;
      }

      if (openFolderLink(plugin, file, "next", checking)) {
        return true;
      }

      return false;
    },
  });

  plugin.addCommand({
    id: "open-parent-note",
    name: "Open parent link (for any type)",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }

      if (openThreeWayPropertyLink(plugin, file, "parent", checking)) {
        return true;
      }

      if (openPeriodicNote(plugin, file, "parent", checking)) {
        return true;
      }

      if (openFolderLink(plugin, file, "parent", checking)) {
        return true;
      }

      return false;
    },
  });

  plugin.addCommand({
    id: "toggle-match-navigation-width",
    name: 'Toggle "Match navigation width to line length"',
    checkCallback: (checking: boolean) => {
      if (!checking) {
        plugin.settingsUnderChange.matchNavigationWidthToLineLength =
          !plugin.settingsUnderChange.matchNavigationWidthToLineLength;
        plugin.triggerSettingsChanged();
      }
      return true;
    },
  });
}

/**
 * Opens the previous, next, or parent property link (helper function for `addCommands`).
 * @param plugin The plugin instance.
 * @param file The active file.
 * @param direction The direction to open.
 * @param checking Whether it is checking availability or executing.
 * @returns Whether the command is available.
 */
function openThreeWayPropertyLink(
  plugin: NavLinkHeader,
  file: TFile,
  direction: ThreeWayDirection,
  checking: boolean,
): boolean {
  if (
    plugin.settings.previousLinkPropertyMappings.length === 0 &&
    plugin.settings.nextLinkPropertyMappings.length === 0 &&
    plugin.settings.parentLinkPropertyMappings.length === 0
  ) {
    return false;
  }

  const links = getThreeWayPropertyLink(plugin, file);

  if (links[direction].length === 0) {
    return false;
  }

  if (!checking) {
    if (links[direction][0].link.isExternal) {
      void openExternalLink(plugin.app, links[direction][0].link.destination, true);
    } else {
      void plugin.app.workspace.openLinkText(links[direction][0].link.destination, file.path);
    }
  }

  return true;
}

/**
 * Opens the previous, next, or parent periodic note (helper function for `addCommands`).
 * @param plugin The plugin instance.
 * @param file The active file.
 * @param direction The direction to open.
 * @param checking Whether it is checking availability or executing.
 * @returns Whether the command is available.
 */
function openPeriodicNote(
  plugin: NavLinkHeader,
  file: TFile,
  direction: ThreeWayDirection,
  checking: boolean,
): boolean {
  const periodicNotesManager = plugin.findComponent(PeriodicNotesManager)!;
  periodicNotesManager.syncActiveState();
  if (!periodicNotesManager.isActive) {
    return false;
  }

  const adjacentNotes = periodicNotesManager.searchAdjacentNotes(file);

  if (direction === "parent" && adjacentNotes.parentDate !== undefined) {
    // Unresolved link
    return false;
  }
  if (adjacentNotes.paths[direction] === undefined) {
    return false;
  }

  if (!checking) {
    void plugin.app.workspace.openLinkText(adjacentNotes.paths[direction], file.path);
  }

  return true;
}

/**
 * Opens the previous, next, or parent folder link (helper function for `addCommands`).
 * @param plugin The plugin instance.
 * @param file The active file.
 * @param direction The direction to open.
 * @param checking Whether it is checking availability or executing.
 * @returns Whether the command is available.
 */
function openFolderLink(
  plugin: NavLinkHeader,
  file: TFile,
  direction: ThreeWayDirection,
  checking: boolean,
): boolean {
  const folderLinksManager = plugin.findComponent(FolderLinksManager)!;
  if (!folderLinksManager.isActive) {
    return false;
  }

  for (const adjacentFiles of folderLinksManager.getAdjacentFiles(file)) {
    const filePaths = adjacentFiles.filePaths[direction];
    if (filePaths.length === 0) {
      continue;
    }

    if (!checking) {
      const index = direction === "previous" ? filePaths.length - 1 : 0;
      void plugin.app.workspace.openLinkText(filePaths[index], file.path);
    }
    return true;
  }

  return false;
}
