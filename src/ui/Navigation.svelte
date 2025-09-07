<script lang="ts">
  import { PrefixedLinkState, ThreeWayLinkState } from "../navigationLinkState";
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
  <div class="nav-link-header-background">
    <div class="nav-link-header-container">
      {#each links as link}
        {#if link instanceof PrefixedLinkState}
          <PrefixedLink state={link} />
        {:else if link instanceof ThreeWayLinkState}
          <ThreeWayLink state={link} />
        {/if}
      {/each}
      {#if isLoading && displayPlaceholder}
        <div class="nav-link-header-muted">Loading...</div>
      {/if}
      {#if links.length === 0 && !isLoading && displayPlaceholder}
        <div class="nav-link-header-muted">No links</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .nav-link-header-background {
    padding: 0.4em;
    background-color: var(--background-primary);
  }

  .nav-link-header-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em;
    padding: 0.4em;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
  }

  .nav-link-header-muted {
    color: var(--text-faint);
  }
</style>
