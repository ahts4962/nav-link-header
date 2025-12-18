<script lang="ts">
  import { NavigationLinkState, type PinnedNoteContentState } from "./states";
  import NavigationLink from "./NavigationLink.svelte";

  const { state }: { state: PinnedNoteContentState } = $props();
</script>

<!--
  @component
  A component that represents a pinned note content.
-->
<div class="nav-link-header-link-container nav-link-header-pinned-note-content">
  <div class="nav-link-header-link-prefix">{state.prefix}</div>
  {#each state.content as item (item)}
    {#if item instanceof NavigationLinkState}
      <NavigationLink state={item} />
    {:else}
      {item}
    {/if}
  {/each}
</div>

<style>
  .nav-link-header-link-prefix {
    display: inline-block;
    white-space: pre-wrap;
  }
</style>
