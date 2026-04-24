<script lang="ts">
  import type { CollapsedItemProps } from "./props";
  import Prefix from "./Prefix.svelte";
  import { t } from "../i18n/i18n";

  const { props }: { props: CollapsedItemProps } = $props();
</script>

<!--
  @component
  A component that represents a collapsed item.
-->
<div class="nav-link-header-link-container nav-link-header-collapsed-item">
  <Prefix props={props.prefix} />
  <div class="nav-link-header-muted">
    {t().ui.collapsedCount(props.itemCount)}
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
