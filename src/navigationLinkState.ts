import { getTitleFromPath } from "./utils";
import { TFile } from "obsidian";

export interface NavigationLinkStateOptions {
	enabled: boolean;
	destinationPath?: string;
	fileExists?: boolean;
	annotation?: string;
	isPropertyLink?: boolean;
	propertyValue?: string | string[];
	clickHandler?: (target: NavigationLinkState, e: MouseEvent) => void;
	mouseOverHandler?: (target: NavigationLinkState, e: MouseEvent) => void;
}

export interface PeriodicNoteLinkStates {
	previous: NavigationLinkState;
	next: NavigationLinkState;
	up: NavigationLinkState;
}

/**
 * Represents a state of the `NavigationLink`.
 */
export class NavigationLinkState {
	public enabled: boolean;
	public destinationPath?: string;
	public fileExists?: boolean;
	public annotation?: string;
	public isPropertyLink?: boolean;
	public propertyValue?: string | string[];
	public clickHandler?: (target: NavigationLinkState, e: MouseEvent) => void;
	public mouseOverHandler?: (
		target: NavigationLinkState,
		e: MouseEvent
	) => void;

	constructor(options: NavigationLinkStateOptions) {
		this.enabled = options.enabled;
		this.destinationPath = options.destinationPath;
		this.fileExists = options.fileExists;
		this.annotation = options.annotation;
		this.isPropertyLink = options.isPropertyLink;
		this.propertyValue = options.propertyValue;
		this.clickHandler = options.clickHandler;
		this.mouseOverHandler = options.mouseOverHandler;
	}

	public get title(): string {
		if (!this.destinationPath) {
			return "";
		}
		return getTitleFromPath(this.destinationPath);
	}

	public get displayTitle(): string {
		if (!this.destinationPath) {
			return "";
		}
		if (this.propertyValue) {
			if (Array.isArray(this.propertyValue)) {
				return this.propertyValue[0] || this.title;
			}
			return this.propertyValue || this.title;
		}
		return this.title;
	}
}
