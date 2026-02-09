<script lang="ts">
  import type { PrefixedMultiLinkProps } from "./props";
  import Link from "./Link.svelte";
  import Prefix from "./Prefix.svelte";

  const {
    props,
    wrapWithContainer = false,
  }: { props: PrefixedMultiLinkProps; wrapWithContainer?: boolean } = $props();
</script>

<!--
  @component
  A component that represents multiple links with a prefix.

  If `wrapWithContainer` is `true`, the links and prefix are wrapped in a container div.
-->
{#if wrapWithContainer}
  <div class="nav-link-header-link-container nav-link-header-prefixed-multi">
    <Prefix props={props.prefix} />
    {#each props.links as link (link)}
      <Link props={link} />
    {/each}
  </div>
{:else}
  <Prefix props={props.prefix} />
  {#each props.links as link (link)}
    <Link props={link} />
  {/each}
{/if}

<style>
  .nav-link-header-link-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em;
  }
</style>
