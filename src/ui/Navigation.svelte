<script lang="ts">
	import {
		NavigationLinkState,
		type PeriodicNoteLinkStates,
	} from "../navigationLinkState";
	import { NavLinkHeaderError, type AsyncValue } from "../utils";
	import Icon from "./Icon.svelte";
	import NavigationLink from "./NavigationLink.svelte";

	// `undefined` is used to indicate that the entire periodic note links are disabled.
	export let periodicNoteLinks: PeriodicNoteLinkStates | undefined;

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
		periodicNoteLinks !== undefined ||
		(annotatedLinks.hasValue && annotatedLinks.value!.length > 0);

	$: noLinkExists =
		!periodicNoteLinks &&
		annotatedLinks.hasValue &&
		annotatedLinks.value!.length === 0;
</script>

<!--
  @component
  The container for navigation links.

  Both periodic note links and annotated links are displayed in this container.
  Annotated links are displayed in the order they appear in the array.
  `annotatedLinksPromise` may be set multiple times.
  The resolved value is cached and displayed until the next promise is resolved.
  If `showPlaceholder` is `true`, a placeholder message is displayed while links are unavailable.
-->
{#if containerVisible}
	<div class="container">
		{#if periodicNoteLinks}
			<Icon iconId="chevrons-left" />
			<NavigationLink state={periodicNoteLinks.previous} />
			<span>||</span>
			{#if periodicNoteLinks.up.enabled}
				<NavigationLink state={periodicNoteLinks.up} />
				<span>||</span>
			{/if}
			<NavigationLink state={periodicNoteLinks.next} />
			<Icon iconId="chevrons-right" />
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
		{#if showPlaceholder && noLinkExists}
			<span class="muted">No links</span>
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
