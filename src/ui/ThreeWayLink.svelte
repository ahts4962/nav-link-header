<script lang="ts">
  import type { ThreeWayLinkState } from "../navigationLinkState";
  import PrefixedLink from "./PrefixedLink.svelte";
  import Icon from "./Icon.svelte";

  const { state }: { state: ThreeWayLinkState } = $props();
</script>

<!--
  @component
  A component that displays a composite link with previous, next, and parent links.

  For each of previous, next, and parent: if the `links` property in the state object is empty
  and `hidden` is `false`, a placeholder is shown. If `hidden` is `true`, nothing is displayed.
-->
<div class="nav-link-header-link-container nav-link-header-three-way">
  {#if state.delimiters === "full"}
    <Icon iconId="chevrons-left" />
  {/if}
  {#if !state.previous.hidden}
    {#if state.previous.links.length > 0}
      {#each state.previous.links as link}
        <PrefixedLink state={link} />
      {/each}
    {:else}
      <Icon iconId="minus" muted />
    {/if}
  {/if}
  {#if state.delimiters !== "none"}
    {#if !state.parent.hidden && !state.previous.hidden}
      <div class="nav-link-header-separator">|</div>
    {/if}
  {/if}
  {#if !state.parent.hidden}
    {#if state.parent.links.length > 0}
      {#each state.parent.links as link}
        <PrefixedLink state={link} />
      {/each}
    {:else}
      <Icon iconId="minus" muted />
    {/if}
  {/if}
  {#if state.delimiters !== "none"}
    {#if !state.next.hidden && (!state.previous.hidden || !state.parent.hidden)}
      <div class="nav-link-header-separator">|</div>
    {/if}
  {/if}
  {#if !state.next.hidden}
    {#if state.next.links.length > 0}
      {#each state.next.links as link}
        <PrefixedLink state={link} />
      {/each}
    {:else}
      <Icon iconId="minus" muted />
    {/if}
  {/if}
  {#if state.delimiters === "full"}
    <Icon iconId="chevrons-right" />
  {/if}
</div>

<style>
  .nav-link-header-link-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em;
  }
</style>
