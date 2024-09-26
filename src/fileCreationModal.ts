import { Modal, Setting } from "obsidian";
import type NavLinkHeader from "./main";

/**
 * Modal to confirm the creation of a new file.
 */
export class FileCreationModal extends Modal {
	/**
	 * @param fileTitle The title of the file to create.
	 * @param onConfirm The callback function called when the creation is confirmed.
	 */
	constructor(
		private plugin: NavLinkHeader,
		private fileTitle: string,
		private onConfirm: () => void
	) {
		super(plugin.app);
	}

	public onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h1", { text: "Create a new note" });
		contentEl.createEl("p", {
			text:
				`File "${this.fileTitle}" does not exist. ` +
				"Are you sure you want to create a new note?",
		});
		new Setting(contentEl)
			.addButton((button) => {
				button
					.setButtonText("Create")
					.setCta()
					.onClick(() => {
						this.close();
						this.onConfirm();
					});
			})
			.addButton((button) => {
				button.setButtonText("Create (Don't ask again)").onClick(() => {
					this.plugin.settings!.confirmFileCreation = false;
					void this.plugin.saveSettings();
					this.close();
					this.onConfirm();
				});
			})
			.addButton((button) => {
				button.setButtonText("Cancel").onClick(() => {
					this.close();
				});
			});
	}

	public onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
