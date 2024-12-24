import type { NavLinkHeaderSettings } from "../settings";

export class Debug {
	private static settings: NavLinkHeaderSettings | null = null;

	public static init(settings: NavLinkHeaderSettings) {
		this.settings = settings;
	}

	public static log(context: string, data?: unknown) {
		if (this.settings?.devMode) {
			console.log(`[NavLinkHeader][${context}]:`, data);
		}
	}
}
