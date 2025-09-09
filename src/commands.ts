import type { TFile } from "obsidian";
import type NavLinkHeader from "./main";
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
    id: "open-previous-property-link",
    name: "Open previous note specified by file property",
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
    name: "Open next note specified by file property",
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
    name: "Open parent note specified by file property",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }
      return openThreeWayPropertyLink(plugin, file, "parent", checking);
    },
  });

  plugin.addCommand({
    id: "open-previous-folder-link",
    name: "Open previous note specified by folder settings",
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
    name: "Open next note specified by folder settings",
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
    name: "Open parent note specified by folder settings",
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
    name: "Open previous note (for any type)",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }

      if (openPeriodicNote(plugin, file, "previous", checking)) {
        return true;
      }

      if (openThreeWayPropertyLink(plugin, file, "previous", checking)) {
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
    name: "Open next note (for any type)",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }

      if (openPeriodicNote(plugin, file, "next", checking)) {
        return true;
      }

      if (openThreeWayPropertyLink(plugin, file, "next", checking)) {
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
    name: "Open parent note (for any type)",
    checkCallback: (checking: boolean) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) {
        return false;
      }

      if (openPeriodicNote(plugin, file, "parent", checking)) {
        return true;
      }

      if (openThreeWayPropertyLink(plugin, file, "parent", checking)) {
        return true;
      }

      if (openFolderLink(plugin, file, "parent", checking)) {
        return true;
      }

      return false;
    },
  });
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
  direction: "previous" | "next" | "parent",
  checking: boolean
): boolean {
  const periodicNotesManager = plugin.findComponent(PeriodicNotesManager)!;
  periodicNotesManager.syncActiveState();
  if (!periodicNotesManager.isActive) {
    return false;
  }

  const adjacentNotes = periodicNotesManager.searchAdjacentNotes(file);

  if (direction === "previous") {
    if (!adjacentNotes.previousPath) {
      return false;
    }
    if (!checking) {
      void plugin.app.workspace.openLinkText(adjacentNotes.previousPath, file.path);
    }
  } else if (direction === "next") {
    if (!adjacentNotes.nextPath) {
      return false;
    }
    if (!checking) {
      void plugin.app.workspace.openLinkText(adjacentNotes.nextPath, file.path);
    }
  } else if (direction === "parent") {
    if (
      !adjacentNotes.parentPath ||
      adjacentNotes.parentDate !== undefined // Unresolved link
    ) {
      return false;
    }
    if (!checking) {
      void plugin.app.workspace.openLinkText(adjacentNotes.parentPath, file.path);
    }
  }

  return true;
}

/**
 * Opens the previous, next, or parent note specified by file property
 * (helper function for `addCommands`).
 * @param plugin The plugin instance.
 * @param file The active file.
 * @param direction The direction to open.
 * @param checking Whether it is checking availability or executing.
 * @returns Whether the command is available.
 */
function openThreeWayPropertyLink(
  plugin: NavLinkHeader,
  file: TFile,
  direction: "previous" | "next" | "parent",
  checking: boolean
): boolean {
  if (
    !plugin.settings.previousLinkProperty &&
    !plugin.settings.nextLinkProperty &&
    !plugin.settings.parentLinkProperty
  ) {
    return false;
  }

  const links = getThreeWayPropertyLink(plugin, file);

  if (direction === "previous") {
    if (!links.previous) {
      return false;
    }
    if (!checking) {
      if (links.previous.isExternal) {
        void openExternalLink(plugin.app, links.previous.destination, true);
      } else {
        void plugin.app.workspace.openLinkText(links.previous.destination, file.path);
      }
    }
  } else if (direction === "next") {
    if (!links.next) {
      return false;
    }
    if (!checking) {
      if (links.next.isExternal) {
        void openExternalLink(plugin.app, links.next.destination, true);
      } else {
        void plugin.app.workspace.openLinkText(links.next.destination, file.path);
      }
    }
  } else if (direction === "parent") {
    if (!links.parent) {
      return false;
    }
    if (!checking) {
      if (links.parent.isExternal) {
        void openExternalLink(plugin.app, links.parent.destination, true);
      } else {
        void plugin.app.workspace.openLinkText(links.parent.destination, file.path);
      }
    }
  }

  return true;
}

/**
 * Opens the previous, next, or parent note specified by folder settings
 * (helper function for `addCommands`).
 * @param plugin The plugin instance.
 * @param file The active file.
 * @param direction The direction to open.
 * @param checking Whether it is checking availability or executing.
 * @returns Whether the command is available.
 */
function openFolderLink(
  plugin: NavLinkHeader,
  file: TFile,
  direction: "previous" | "next" | "parent",
  checking: boolean
): boolean {
  const folderLinksManager = plugin.findComponent(FolderLinksManager)!;
  if (!folderLinksManager.isActive) {
    return false;
  }

  for (const adjacentFiles of folderLinksManager.getAdjacentFiles(file)) {
    if (direction === "previous") {
      if (!adjacentFiles.previous) {
        continue;
      }
      if (!checking) {
        void plugin.app.workspace.openLinkText(adjacentFiles.previous, file.path);
      }
      return true;
    } else if (direction === "next") {
      if (!adjacentFiles.next) {
        continue;
      }
      if (!checking) {
        void plugin.app.workspace.openLinkText(adjacentFiles.next, file.path);
      }
      return true;
    } else if (direction === "parent") {
      if (!adjacentFiles.parent) {
        continue;
      }
      if (!checking) {
        void plugin.app.workspace.openLinkText(adjacentFiles.parent, file.path);
      }
      return true;
    }
  }

  return false;
}
