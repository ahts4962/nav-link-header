<script lang="ts">
  import type { ThreeWayLinkProps } from "./props";
  import PrefixedLink from "./PrefixedLink.svelte";
  import Icon from "./Icon.svelte";

  const { props }: { props: ThreeWayLinkProps } = $props();
  const isPreviousHidden = $derived(props.links.previous.hidden);
  const isNextHidden = $derived(props.links.next.hidden);
  const isParentHidden = $derived(props.links.parent.hidden);

  const separator = $derived(
    props.delimiters === "full-double-separator" || props.delimiters === "double-separator"
      ? "||"
      : props.delimiters !== "none"
        ? "|"
        : "",
  );
</script>

<!--
  @component
  A component that displays a composite link with previous, next, and parent links.

  For each of previous, next, and parent: if the `links` property in the state object is empty
  and `hidden` is `false`, a placeholder is shown. If `hidden` is `true`, nothing is displayed.
-->
<div class="nav-link-header-link-container nav-link-header-three-way">
  {#if props.delimiters === "full" || props.delimiters === "full-double-separator"}
    <Icon iconId="chevrons-left" />
  {/if}

  {#if !isPreviousHidden}
    {#if props.links.previous.links.length > 0}
      {#each props.links.previous.links as link (link)}
        <PrefixedLink props={link} />
      {/each}
    {:else}
      <Icon iconId="minus" muted />
    {/if}
  {/if}

  {#if !isParentHidden && !isPreviousHidden}
    <div class="nav-link-header-separator">{separator}</div>
  {/if}

  {#if !isParentHidden}
    {#if props.links.parent.links.length > 0}
      {#each props.links.parent.links as link (link)}
        <PrefixedLink props={link} />
      {/each}
    {:else}
      <Icon iconId="minus" muted />
    {/if}
  {/if}

  {#if !isNextHidden && (!isPreviousHidden || !isParentHidden)}
    <div class="nav-link-header-separator">{separator}</div>
  {/if}

  {#if !isNextHidden}
    {#if props.links.next.links.length > 0}
      {#each props.links.next.links as link (link)}
        <PrefixedLink props={link} />
      {/each}
    {:else}
      <Icon iconId="minus" muted />
    {/if}
  {/if}

  {#if props.delimiters === "full" || props.delimiters === "full-double-separator"}
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
