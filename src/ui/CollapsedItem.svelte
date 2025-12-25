<script lang="ts">
  import type { CollapsedItemProps } from "./props";
  import Prefix from "./Prefix.svelte";

  const { props }: { props: CollapsedItemProps } = $props();
</script>

<!--
  @component
  A component that represents a collapsed item.
-->
<div class="nav-link-header-link-container nav-link-header-collapsed-item">
  <Prefix props={props.prefix} />
  <div class="nav-link-header-muted">
    {`(${props.itemCount} ${props.itemCount === 1 ? "item" : "items"})`}
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
