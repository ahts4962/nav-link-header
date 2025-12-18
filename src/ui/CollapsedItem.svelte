<script lang="ts">
  import type { CollapsedItemState } from "./states";
  import Prefix from "./Prefix.svelte";

  const { state }: { state: CollapsedItemState } = $props();
</script>

<!--
  @component
  A component that represents a collapsed item.
-->
<div class="nav-link-header-link-container nav-link-header-collapsed-item">
  <Prefix state={state.prefix} />
  <div class="nav-link-header-muted">
    {`(${state.itemCount} ${state.itemCount === 1 ? "item" : "items"})`}
  </div>
</div>

<style>
  .nav-link-header-link-container {
    display: flex;
    flex-wrap: wrap;
  }

  .nav-link-header-muted {
    color: var(--text-faint);
  }
</style>
