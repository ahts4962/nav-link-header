import { debounce, Plugin, type HoverParent } from "obsidian";
import type { PluginComponent } from "./pluginComponent";
import { LeavesUpdater } from "./leavesUpdater";
import { HoverPopoverUpdater } from "./hoverPopoverUpdater";
import { AnnotatedLinksManager } from "./annotatedLink";
import { ImplicitPropertyManager } from "./implicitPropertyManager";
import { PeriodicNotesManager } from "./periodicNotes";
import { FolderLinksManager } from "./folderLink";
import { addCommands } from "./commands";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  NavLinkHeaderSettingTab,
  type NavLinkHeaderSettings,
} from "./settings";
import { deepCopy } from "./utils";

export const NAVIGATION_ELEMENT_CLASS_NAME: string = "nav-link-header-navigation";

export default class NavLinkHeader extends Plugin {
  private components: PluginComponent[] = [];

  private metadataResolved: boolean = false;

  // Currently applied settings.
  private _settings: NavLinkHeaderSettings = deepCopy(DEFAULT_SETTINGS);

  public get settings(): NavLinkHeaderSettings {
    return this._settings;
  }

  // The settings currently being edited.
  // Modify this value in the settings page, etc., and apply it to `this.settings`
  // by calling this.triggerSettingsChanged() or this.triggerSettingsChangedDebounced().
  private _settingsUnderChange: NavLinkHeaderSettings = deepCopy(DEFAULT_SETTINGS);

  public get settingsUnderChange(): NavLinkHeaderSettings {
    return this._settingsUnderChange;
  }

  public findComponent<T extends PluginComponent>(
    ctor: new (...args: never[]) => T
  ): T | undefined {
    return this.components.find((component): component is T => component instanceof ctor);
  }

  public onload(): void {
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    this._settings = await loadSettings(this);
    this._settingsUnderChange = deepCopy(this.settings);
    await this.saveData(this.settings);
    this.addSettingTab(new NavLinkHeaderSettingTab(this));

    this.app.workspace.onLayoutReady(() => {
      this.components.push(new LeavesUpdater(this));
      this.components.push(new HoverPopoverUpdater(this));
      this.components.push(new AnnotatedLinksManager(this));
      this.components.push(new ImplicitPropertyManager(this));
      this.components.push(new PeriodicNotesManager(this));
      this.components.push(new FolderLinksManager(this));

      addCommands(this);
      this.registerEvents();

      // Registers the hover link source for the hover popover.
      this.registerHoverLinkSource("nav-link-header", {
        defaultMod: true,
        display: "Nav Link Header",
      });

      this.triggerForcedNavigationUpdateRequired();
    });
  }

  private registerEvents(): void {
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        for (const component of this.components) {
          component.onFileCreated(file);
        }
        this.triggerForcedNavigationUpdateRequiredDebounced();
      })
    );

    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        for (const component of this.components) {
          component.onFileDeleted(file);
        }
        this.triggerForcedNavigationUpdateRequiredDebounced();
      })
    );

    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        for (const component of this.components) {
          component.onFileRenamed(file, oldPath);
        }
        this.triggerForcedNavigationUpdateRequiredDebounced();
      })
    );

    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        for (const component of this.components) {
          component.onFileModified(file);
        }
        this.triggerForcedNavigationUpdateRequiredDebounced();
      })
    );

    this.registerEvent(
      this.app.metadataCache.on("resolved", () => {
        if (this.metadataResolved) {
          return;
        }
        this.metadataResolved = true;
        for (const component of this.components) {
          component.onMetadataResolved();
        }
        this.triggerForcedNavigationUpdateRequiredDebounced();
      })
    );

    this.registerEvent(
      this.app.metadataCache.on("changed", (file, data, cache) => {
        // "changed" event implies that the initial resolution is done.
        this.metadataResolved = true;

        for (const component of this.components) {
          component.onMetadataChanged(file, data, cache);
        }
        this.triggerForcedNavigationUpdateRequiredDebounced();
      })
    );

    this.registerEvent(
      this.app.workspace.on("window-open", (window) => {
        for (const component of this.components) {
          component.onWindowOpen(window);
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on("window-close", (window) => {
        for (const component of this.components) {
          component.onWindowClose(window);
        }
      })
    );

    this.registerEvent(
      // @ts-expect-error: hover-link event is not exposed explicitly.
      this.app.workspace.on("hover-link", ({ hoverParent }) => {
        for (const component of this.components) {
          component.onHoverLink(hoverParent as HoverParent);
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        for (const component of this.components) {
          component.onNavigationUpdateRequired();
        }
      })
    );

    this.registerEvent(
      // @ts-expect-error: custom event.
      this.app.workspace.on("nav-link-header:forced-navigation-update-required", () => {
        for (const component of this.components) {
          component.onForcedNavigationUpdateRequired();
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on(
        // @ts-expect-error: custom event.
        "nav-link-header:settings-changed",
        () => {
          const previousSettings = this.settings;
          this._settings = deepCopy(this.settingsUnderChange);

          for (const component of this.components) {
            component.onSettingsChanged(previousSettings, this.settings);
          }

          this.triggerForcedNavigationUpdateRequired();

          void this.saveData(this.settings);
        }
      )
    );

    this.registerEvent(
      this.app.workspace.on(
        // @ts-expect-error: custom event.
        "nav-link-header:periodic-notes-settings-changed",
        () => {
          this.findComponent(PeriodicNotesManager)?.onPeriodicNoteSettingsChanged();
          this.triggerForcedNavigationUpdateRequired();
        }
      )
    );

    this.registerEvent(
      this.app.workspace.on(
        // @ts-expect-error: custom event.
        "periodic-notes:settings-updated",
        () => {
          this.triggerPeriodicNoteSettingsChangedDebounced();
        }
      )
    );
  }

  private triggerForcedNavigationUpdateRequired(): void {
    this.app.workspace.trigger("nav-link-header:forced-navigation-update-required");
  }

  private triggerForcedNavigationUpdateRequiredDebounced = debounce(
    () => {
      this.triggerForcedNavigationUpdateRequired();
    },
    500,
    true
  );

  public triggerSettingsChanged(): void {
    this.app.workspace.trigger("nav-link-header:settings-changed");
  }

  public triggerSettingsChangedDebounced = debounce(
    () => {
      this.triggerSettingsChanged();
    },
    500,
    true
  );

  private triggerPeriodicNoteSettingsChangedDebounced = debounce(
    () => {
      this.app.workspace.trigger("nav-link-header:periodic-notes-settings-changed");
    },
    500,
    true
  );

  /**
   * Cleans up the plugin.
   */
  public onunload(): void {
    this.triggerForcedNavigationUpdateRequiredDebounced.cancel();
    this.triggerSettingsChangedDebounced.cancel();
    this.triggerPeriodicNoteSettingsChangedDebounced.cancel();

    void this.saveData(this.settingsUnderChange);

    this.components.forEach((component) => component.dispose());
    this.components = [];
  }
}
