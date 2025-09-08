<script lang="ts">
  import type { PrefixedLinkState } from "../navigationLinkState";
  import NavigationLink from "./NavigationLink.svelte";

  const {
    state,
    hideAnnotatedLinkPrefix,
  }: { state: PrefixedLinkState; hideAnnotatedLinkPrefix: boolean } = $props();
</script>

<!--
  @component
  A component that represents a link with a prefix string (typically emoji).
-->
<div class="nav-link-header-container">
  {#if state.type !== "annotated" || !hideAnnotatedLinkPrefix}
    <div>{state.prefix}</div>
  {/if}
  <NavigationLink state={state.link} />
</div>

<style>
  .nav-link-header-container {
    display: flex;
    flex-wrap: wrap;
  }
</style>
