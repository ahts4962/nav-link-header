<script lang="ts">
  import type { PrefixedLinkState } from "./states";
  import NavigationLink from "./NavigationLink.svelte";
  import Prefix from "./Prefix.svelte";

  const { state }: { state: PrefixedLinkState } = $props();
</script>

<!--
  @component
  A component that represents a link with a prefix.
-->
<div class="nav-link-header-link-container nav-link-header-prefixed">
  <Prefix state={state.prefix} />
  <NavigationLink state={state.link} />
</div>

<style>
  .nav-link-header-link-container {
    display: flex;
    flex-wrap: wrap;
  }
</style>
