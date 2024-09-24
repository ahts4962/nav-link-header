<script lang="ts">
	import { NavigationLinkState } from "../navigationLinkState";
	import { type ThreeWay } from "../periodicNotes";
	import { type AsyncValue, NavLinkHeaderError } from "../utils";
	import Icon from "./Icon.svelte";
	import NavigationLink from "./NavigationLink.svelte";

	// The input of periodic note links.
	// Receives a promise and sets the value to `AsyncValue` when the promise is resolved.
	// `undefined` is used to indicate that the entire periodic note links are disabled.
	let periodicNoteLinks: AsyncValue<
		ThreeWay<NavigationLinkState> | undefined
	> = {
		hasValue: false,
	};

	export let periodicNoteLinksPromise:
		| Promise<ThreeWay<NavigationLinkState> | undefined>
		| undefined;

	$: periodicNoteLinksPromise
		?.then((links) => {
			periodicNoteLinks = {
				hasValue: true,
				value: links,
			};
		})
		.catch((error) => {
			if (!(error instanceof NavLinkHeaderError)) {
				console.log(error);
			}
		});

	// The input of annotated links.
	// Receives a promise and sets the value to `AsyncValue` when the promise is resolved.
	let annotatedLinks: AsyncValue<NavigationLinkState[]> = {
		hasValue: false,
	};

	export let annotatedLinksPromise:
		| Promise<NavigationLinkState[]>
		| undefined;

	$: annotatedLinksPromise
		?.then((links) => {
			annotatedLinks = {
				hasValue: true,
				value: links,
			};
		})
		.catch((error) => {
			if (!(error instanceof NavLinkHeaderError)) {
				console.log(error);
			}
		});

	export let showPlaceholder: boolean = true;

	$: containerVisible =
		showPlaceholder ||
		(periodicNoteLinks.hasValue && periodicNoteLinks.value !== undefined) ||
		(annotatedLinks.hasValue && annotatedLinks.value!.length > 0);

	$: noLinksAvailable =
		periodicNoteLinks.hasValue &&
		!periodicNoteLinks.value &&
		annotatedLinks.hasValue &&
		annotatedLinks.value!.length === 0;
</script>

<!--
  @component
  The container for navigation links.

  Both periodic note links and annotated links are displayed in this container.
  Annotated links are displayed in the order they appear in the array.
  `periodicNoteLinksPromise` and `annotatedLinksPromise` may be set multiple times.
  The resolved value is cached and displayed until the next promise is resolved.
  If `showPlaceholder` is `true`, a placeholder message is displayed while links are unavailable.
-->
{#if containerVisible}
	<div class="container">
		{#if !periodicNoteLinks.hasValue && !annotatedLinks.hasValue}
			{#if showPlaceholder}
				<span class="muted">Searching...</span>
			{/if}
		{:else}
			{#if periodicNoteLinks.hasValue}
				{#if periodicNoteLinks.value}
					<Icon iconId="chevrons-left" />
					<NavigationLink state={periodicNoteLinks.value.previous} />
					<span>||</span>
					{#if periodicNoteLinks.value.up.enabled}
						<NavigationLink state={periodicNoteLinks.value.up} />
						<span>||</span>
					{/if}
					<NavigationLink state={periodicNoteLinks.value.next} />
					<Icon iconId="chevrons-right" />
				{/if}
			{:else if showPlaceholder}
				<span class="muted">Searching...</span>
			{/if}
			{#if annotatedLinks.hasValue && annotatedLinks.value}
				{#each annotatedLinks.value as link}
					<span class="annotated-link">
						<NavigationLink state={link} />
					</span>
				{/each}
			{:else if showPlaceholder}
				<span class="muted">Searching...</span>
			{/if}
			{#if showPlaceholder && noLinksAvailable}
				<span class="muted">No links</span>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.container {
		margin: 0.4em;
		padding: 0.4em;
		border: 1px solid var(--background-modifier-border);
		border-radius: 0.4em;
	}

	.annotated-link:not(:first-child) {
		margin-left: 0.2em;
	}

	.muted {
		color: var(--text-faint);
	}
</style>
