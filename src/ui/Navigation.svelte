<script lang="ts">
  import {
    PrefixedLinkState,
    ThreeWayLinkState,
    PinnedNoteContentState,
  } from "../navigationLinkState";
  import PrefixedLink from "./PrefixedLink.svelte";
  import ThreeWayLink from "./ThreeWayLink.svelte";
  import PinnedNoteContent from "./PinnedNoteContent.svelte";

  const {
    links,
    isLoading,
    matchWidthToLineLength,
    displayLoadingMessage,
    displayPlaceholder,
  }: {
    links: (PrefixedLinkState | ThreeWayLinkState | PinnedNoteContentState)[];
    isLoading: boolean;
    matchWidthToLineLength: boolean;
    displayLoadingMessage: boolean;
    displayPlaceholder: boolean;
  } = $props();

  const showNavigation = $derived(
    links.length > 0 ||
      (isLoading && displayLoadingMessage) ||
      (links.length === 0 && !isLoading && displayPlaceholder),
  );
</script>

<!--
  @component
  Container for navigation links.

  Links are displayed in the order provided by the `links` prop.
  The loading message and "No links" placeholder are shown based on the relevant properties.
  If `matchWidthToLineLength` is `true`, the navigation width matches
  the note's content line length.
-->
{#if showNavigation}
  <div
    class={[
      "nav-link-header-background",
      matchWidthToLineLength && "nav-link-header-width-matched",
    ]}
  >
    <div
      class={[
        "nav-link-header-container",
        matchWidthToLineLength && "nav-link-header-width-matched",
      ]}
    >
      {#each links as link (link)}
        {#if link instanceof PrefixedLinkState}
          <PrefixedLink state={link} />
        {:else if link instanceof ThreeWayLinkState}
          <ThreeWayLink state={link} />
        {:else if link instanceof PinnedNoteContentState}
          <PinnedNoteContent state={link} />
        {/if}
      {/each}
      {#if isLoading && displayLoadingMessage}
        <div class="nav-link-header-message nav-link-header-muted">Loading...</div>
      {/if}
      {#if links.length === 0 && !isLoading && displayPlaceholder}
        <div class="nav-link-header-message nav-link-header-muted">No links</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .nav-link-header-background {
    padding: 0.4em;
    background-color: var(--background-primary);

    &.nav-link-header-width-matched {
      padding: var(--file-margins);
      padding-top: 0.4em;
      padding-bottom: 0.4em;
      overflow-y: auto;
      scrollbar-gutter: stable;
    }
  }

  .nav-link-header-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em;
    padding: 0.4em;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);

    &.nav-link-header-width-matched {
      margin-left: auto;
      margin-right: auto;
      max-width: var(--file-line-width);
    }
  }

  .nav-link-header-muted {
    color: var(--text-faint);
  }
</style>
