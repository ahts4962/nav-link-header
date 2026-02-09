<script lang="ts">
  import type { PrefixedMultiLinkProps } from "./props";
  import Link from "./Link.svelte";
  import Prefix from "./Prefix.svelte";

  const { props }: { props: PrefixedMultiLinkProps } = $props();
</script>

<!--
  @component
  A component that represents multiple links with a prefix.
-->
<div class="nav-link-header-link-container nav-link-header-prefixed-multi">
  <Prefix props={props.prefix} />
  <div class="nav-link-header-prefixed-links">
    {#each props.links as link (link)}
      <Link props={link} />
    {/each}
  </div>
</div>

<style>
  .nav-link-header-link-container {
    display: flex;
    flex-wrap: wrap;
  }

  .nav-link-header-prefixed-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em;
  }
</style>
