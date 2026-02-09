<script lang="ts">
  import type { NavigationItemProps } from "./props";
  import CollapsedItem from "./CollapsedItem.svelte";
  import NoteContent from "./NoteContent.svelte";
  import PrefixedLink from "./PrefixedLink.svelte";
  import PrefixedMultiLink from "./PrefixedMultiLink.svelte";
  import ThreeWayLink from "./ThreeWayLink.svelte";

  const {
    items,
    isLoading,
    matchWidthToLineLength,
    displayLoadingMessage,
    displayPlaceholder,
    onHeightChange,
  }: {
    items: NavigationItemProps[];
    isLoading: boolean;
    matchWidthToLineLength: boolean;
    displayLoadingMessage: boolean;
    displayPlaceholder: boolean;
    onHeightChange?: (height: number) => void;
  } = $props();

  const showNavigation = $derived(
    items.length > 0 ||
      (isLoading && displayLoadingMessage) ||
      (items.length === 0 && !isLoading && displayPlaceholder),
  );

  let height = $state(0);
  $effect(() => onHeightChange?.(showNavigation ? height : 0));
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
    bind:clientHeight={height}
  >
    <div
      class={[
        "nav-link-header-container",
        matchWidthToLineLength && "nav-link-header-width-matched",
      ]}
    >
      {#each items as item (item)}
        {#if item.type === "prefixed-link"}
          <PrefixedLink props={item} />
        {:else if item.type === "prefixed-multi-link"}
          <PrefixedMultiLink props={item} />
        {:else if item.type === "three-way-link"}
          <ThreeWayLink props={item} />
        {:else if item.type === "note-content"}
          <NoteContent props={item} />
        {:else if item.type === "collapsed-item"}
          <CollapsedItem props={item} />
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
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);

    &.nav-link-header-width-matched {
      margin-left: auto;
      margin-right: auto;
      max-width: var(--file-line-width);
    }
  }

  :global(.is-phone) {
    .nav-link-header-background {
      padding: var(--size-4-3);

      &.nav-link-header-width-matched {
        padding: var(--file-margins);
        padding-top: var(--size-4-3);
        padding-bottom: var(--size-4-3);
      }
    }

    .nav-link-header-container {
      background: var(--raised-background);
      backdrop-filter: var(--raised-blur);
      box-shadow: var(--raised-shadow);
      border: var(--raised-mask-border-width) solid transparent;
      border-radius: var(--radius-xl);
    }
  }

  .nav-link-header-muted {
    color: var(--text-faint);
  }
</style>
