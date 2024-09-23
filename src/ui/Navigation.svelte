<script lang="ts">
	import { NavigationLinkState } from "../navigationLinkState";
	import NavigationLink from "./NavigationLink.svelte";

	export let navigationLinkStates: Promise<NavigationLinkState[]> =
		Promise.resolve([]);
</script>

<!--
  @component
  The container for navigation links.

  The `navigationLinkStates` property resolves to an array of `NavigationLinkState`
  representing the navigation links displayed in this component.
  Navigation links are displayed in the order they appear in the array.
-->
<div class="container">
	{#await navigationLinkStates}
		<span class="muted">Searching...</span>
	{:then states}
		{#if states.length > 0}
			{#each states as state}
				<span class="annotated-link">
					<NavigationLink {state} />
				</span>
			{/each}
		{:else}
			<span class="muted">No links</span>
		{/if}
	{:catch}
		<span class="muted">Error</span>
	{/await}
</div>

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
