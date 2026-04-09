import { Modal, Setting } from "obsidian";
import type NavLinkHeader from "./main";
import { t } from "./i18n/i18n";

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
    private onConfirm: () => void,
  ) {
    super(plugin.app);
  }

  public onOpen(): void {
    const { contentEl } = this;
    const msg = t().modal;
    contentEl.createEl("h1", { text: msg.createNewNote });
    contentEl.createEl("p", {
      text: msg.fileNotExist(this.fileTitle),
    });
    new Setting(contentEl)
      .addButton((button) => {
        button
          .setButtonText(msg.create)
          .setCta()
          .onClick(() => {
            this.close();
            this.onConfirm();
          });
      })
      .addButton((button) => {
        button.setButtonText(msg.createDontAskAgain).onClick(() => {
          this.plugin.settingsUnderChange.confirmFileCreation = false;
          this.plugin.triggerSettingsChangedDebounced();
          this.close();
          this.onConfirm();
        });
      })
      .addButton((button) => {
        button.setButtonText(msg.cancel).onClick(() => {
          this.close();
        });
      });
  }

  public onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
