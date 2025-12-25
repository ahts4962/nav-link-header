<script lang="ts">
  import type { NoteContentProps } from "./props";
  import Link from "./Link.svelte";
  import Prefix from "./Prefix.svelte";

  const { props }: { props: NoteContentProps } = $props();
</script>

<!--
  @component
  A component that represents a pinned note content.
-->
<div class="nav-link-header-link-container nav-link-header-pinned-note-content">
  <Prefix props={props.prefix} />
  {#each props.content as item (item)}
    {#if typeof item === "string"}
      {item}
    {:else}
      <Link props={item} />
    {/if}
  {/each}
</div>
