<script lang="ts">
  import {
    CollapsedItemState,
    PinnedNoteContentState,
    PrefixedLinkState,
    ThreeWayLinkState,
  } from "./states";
  import CollapsedItem from "./CollapsedItem.svelte";
  import PinnedNoteContent from "./PinnedNoteContent.svelte";
  import PrefixedLink from "./PrefixedLink.svelte";
  import ThreeWayLink from "./ThreeWayLink.svelte";

  const {
    items,
    isLoading,
    matchWidthToLineLength,
    displayLoadingMessage,
    displayPlaceholder,
  }: {
    items: (PrefixedLinkState | ThreeWayLinkState | PinnedNoteContentState | CollapsedItemState)[];
    isLoading: boolean;
    matchWidthToLineLength: boolean;
    displayLoadingMessage: boolean;
    displayPlaceholder: boolean;
  } = $props();

  const showNavigation = $derived(
    items.length > 0 ||
      (isLoading && displayLoadingMessage) ||
      (items.length === 0 && !isLoading && displayPlaceholder),
  );
</script>

<!--
  @component
  Container for navigation links.

  Links are displayed in the order provided by the `items` prop.
  The loading message and "No links" placeholder are shown based on the relevant properties.
  If `matchWidthToLineLength` is `true`, the navigation header width matches
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
      {#each items as item (item)}
        {#if item instanceof PrefixedLinkState}
          <PrefixedLink state={item} />
        {:else if item instanceof ThreeWayLinkState}
          <ThreeWayLink state={item} />
        {:else if item instanceof PinnedNoteContentState}
          <PinnedNoteContent state={item} />
        {:else if item instanceof CollapsedItemState}
          <CollapsedItem state={item} />
        {/if}
      {/each}
      {#if isLoading && displayLoadingMessage}
        <div class="nav-link-header-message nav-link-header-muted">Loading...</div>
      {/if}
      {#if items.length === 0 && !isLoading && displayPlaceholder}
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
