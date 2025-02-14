import type { TFile } from "obsidian";
import type NavLinkHeader from "./main";
import { getThreeWayPropertyLink } from "./propertyLink";

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

			let result = openPeriodicNote(plugin, file, "previous", checking);
			if (result) {
				return true;
			}

			result = openThreeWayPropertyLink(
				plugin,
				file,
				"previous",
				checking
			);
			if (result) {
				return true;
			}

			result = openFolderLink(plugin, file, "previous", checking);
			if (result) {
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

			let result = openPeriodicNote(plugin, file, "next", checking);
			if (result) {
				return true;
			}

			result = openThreeWayPropertyLink(plugin, file, "next", checking);
			if (result) {
				return true;
			}

			result = openFolderLink(plugin, file, "next", checking);
			if (result) {
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

			let result = openPeriodicNote(plugin, file, "parent", checking);
			if (result) {
				return true;
			}

			result = openThreeWayPropertyLink(plugin, file, "parent", checking);
			if (result) {
				return true;
			}

			result = openFolderLink(plugin, file, "parent", checking);
			if (result) {
				return true;
			}

			return false;
		},
	});
}

function openPeriodicNote(
	plugin: NavLinkHeader,
	file: TFile,
	direction: "previous" | "next" | "parent",
	checking: boolean
): boolean {
	if (!plugin.periodicNotesActive) {
		return false;
	}

	const adjacentNotes =
		plugin.periodicNotesManager!.searchAdjacentNotes(file);

	if (direction === "previous") {
		if (!adjacentNotes.previousPath) {
			return false;
		}
		if (!checking) {
			void plugin.app.workspace.openLinkText(
				adjacentNotes.previousPath,
				file.path
			);
		}
	} else if (direction === "next") {
		if (!adjacentNotes.nextPath) {
			return false;
		}
		if (!checking) {
			void plugin.app.workspace.openLinkText(
				adjacentNotes.nextPath,
				file.path
			);
		}
	} else if (direction === "parent") {
		if (
			!adjacentNotes.parentPath ||
			adjacentNotes.parentDate !== undefined
		) {
			return false;
		}
		if (!checking) {
			void plugin.app.workspace.openLinkText(
				adjacentNotes.parentPath,
				file.path
			);
		}
	}

	return true;
}

function openThreeWayPropertyLink(
	plugin: NavLinkHeader,
	file: TFile,
	direction: "previous" | "next" | "parent",
	checking: boolean
): boolean {
	if (
		!plugin.settings!.previousLinkProperty &&
		!plugin.settings!.nextLinkProperty &&
		!plugin.settings!.parentLinkProperty
	) {
		return false;
	}

	const links = getThreeWayPropertyLink(plugin, file);

	if (direction === "previous") {
		if (!links.previous) {
			return false;
		}
		if (!checking) {
			void plugin.app.workspace.openLinkText(
				links.previous.destinationPath,
				file.path
			);
		}
	} else if (direction === "next") {
		if (!links.next) {
			return false;
		}
		if (!checking) {
			void plugin.app.workspace.openLinkText(
				links.next.destinationPath,
				file.path
			);
		}
	} else if (direction === "parent") {
		if (!links.parent) {
			return false;
		}
		if (!checking) {
			void plugin.app.workspace.openLinkText(
				links.parent.destinationPath,
				file.path
			);
		}
	}

	return true;
}

function openFolderLink(
	plugin: NavLinkHeader,
	file: TFile,
	direction: "previous" | "next" | "parent",
	checking: boolean
): boolean {
	if (plugin.settings!.folderLinksSettingsArray.length === 0) {
		return false;
	}

	for (let i = 0; i < plugin.folderLinksManager.length; i++) {
		const manager = plugin.folderLinksManager[i];
		const links = manager.getAdjacentFiles(file);
		if (direction === "previous") {
			if (!links.previous) {
				continue;
			}
			if (!checking) {
				void plugin.app.workspace.openLinkText(
					links.previous,
					file.path
				);
			}
			return true;
		} else if (direction === "next") {
			if (!links.next) {
				continue;
			}
			if (!checking) {
				void plugin.app.workspace.openLinkText(links.next, file.path);
			}
			return true;
		} else if (direction === "parent") {
			if (!links.parent) {
				continue;
			}
			if (!checking) {
				void plugin.app.workspace.openLinkText(links.parent, file.path);
			}
			return true;
		}
	}

	return false;
}
