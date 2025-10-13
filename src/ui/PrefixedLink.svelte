<script lang="ts">
  import type { PrefixedLinkState } from "../navigationLinkState";
  import NavigationLink from "./NavigationLink.svelte";

  const { state }: { state: PrefixedLinkState } = $props();
</script>

<!--
  @component
  A component that represents a link with a prefix string (typically emoji).
-->
<div class="nav-link-header-link-container nav-link-header-prefixed">
  <div class="nav-link-header-link-prefix">{state.prefix}</div>
  <NavigationLink state={state.link} />
</div>

<style>
  .nav-link-header-link-container {
    display: flex;
    flex-wrap: wrap;
  }
  .nav-link-header-link-prefix {
    white-space: pre-wrap;
  }
</style>
