/**
 * Represents an error specific to the plugin.
 */
export class PluginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PluginError";
  }
}
