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

  If `state.type` is `"annotated"` and `hideAnnotatedLinkPrefix` is `true`,
  the prefix will be hidden.
-->
<div class="nav-link-header-link-container nav-link-header-prefixed">
  {#if state.type !== "annotated" || !hideAnnotatedLinkPrefix}
    <div class="nav-link-header-link-prefix">{state.prefix}</div>
  {/if}
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
