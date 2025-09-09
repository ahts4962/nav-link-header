<script lang="ts">
  import type { NavigationLinkState } from "../navigationLinkState";
  import Icon from "./Icon.svelte";

  const { state }: { state: NavigationLinkState } = $props();
</script>

<!--
  @component
  A component that represents a link to a note.

  If `state.resolved` is `false`, the link will be rendered as an unresolved link.
  If `state.isExternal` is `true`, an external link icon will be displayed next to the link.
-->
<div class="nav-link-header-container">
  <a
    class={[!state.resolved && "nav-link-header-unresolved"]}
    href="#top"
    onclick={(e) => {
      e.preventDefault();
      state.clickHandler(state, e);
    }}
    onauxclick={(e) => {
      e.preventDefault();
      state.clickHandler(state, e);
    }}
    onmouseover={(e) => {
      state.mouseOverHandler(state, e);
    }}
    onfocus={() => {}}>{state.displayText}</a
  >
  {#if state.isExternal}
    <Icon iconId="external-link" muted size="var(--icon-xs)" />
  {/if}
</div>

<style>
  .nav-link-header-container {
    display: flex;
    flex-wrap: wrap;
  }

  .nav-link-header-unresolved {
    color: var(--link-unresolved-color);
    text-decoration-color: var(--link-unresolved-decoration-color);
    text-decoration-style: var(--link-unresolved-decoration-style);
    opacity: var(--link-unresolved-opacity);
    filter: var(--link-unresolved-filter);

    &:hover {
      opacity: 1;
    }
  }
</style>
