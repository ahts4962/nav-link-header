<script lang="ts">
	import {
		PrefixedLinkState,
		ThreeWayLinkState,
	} from "../navigationLinkState";
	import PrefixedLink from "./PrefixedLink.svelte";
	import ThreeWayLink from "./ThreeWayLink.svelte";

	const {
		links,
		isLoading,
		displayPlaceholder,
	}: {
		links: (PrefixedLinkState | ThreeWayLinkState)[];
		isLoading: boolean;
		displayPlaceholder: boolean;
	} = $props();
</script>

<!--
  @component
  The container for navigation links.

  Links are displayed in the order they are provided in the `links` prop.
  If `isLoading` is `true` and `displayPlaceholder` is `true`, "Loading..."
  will be displayed after the links that have already been loaded.
  If `links` is empty and `isLoading` is `false` and `displayPlaceholder` is `true`,
  "No links" will be displayed.
-->
{#if links.length > 0 || displayPlaceholder}
	<div class="background">
		<div class="container">
			{#each links as link}
				<span class="sub-container">
					{#if link instanceof PrefixedLinkState}
						<PrefixedLink state={link} />
					{:else if link instanceof ThreeWayLinkState}
						<ThreeWayLink state={link} />
					{/if}
				</span>
			{/each}
			{#if isLoading && displayPlaceholder}
				<span class="muted">Loading...</span>
			{/if}
			{#if links.length === 0 && !isLoading && displayPlaceholder}
				<span class="muted">No links</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.background {
		padding: 0.4em;
		background-color: var(--background-primary);
	}

	.container {
		padding: 0.4em;
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-s);
	}

	.sub-container:not(:first-child) {
		margin-inline-start: 0.4em;
	}

	.muted {
		color: var(--text-faint);
	}
</style>
