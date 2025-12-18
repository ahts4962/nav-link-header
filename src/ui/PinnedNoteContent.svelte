<script lang="ts">
  import { NavigationLinkState, type PinnedNoteContentState } from "./states";
  import NavigationLink from "./NavigationLink.svelte";
  import Prefix from "./Prefix.svelte";

  const { state }: { state: PinnedNoteContentState } = $props();
</script>

<!--
  @component
  A component that represents a pinned note content.
-->
<div class="nav-link-header-link-container nav-link-header-pinned-note-content">
  <Prefix state={state.prefix} />
  {#each state.content as item (item)}
    {#if item instanceof NavigationLinkState}
      <NavigationLink state={item} />
    {:else}
      {item}
    {/if}
  {/each}
</div>
