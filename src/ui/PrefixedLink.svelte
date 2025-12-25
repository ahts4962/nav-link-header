<script lang="ts">
  import type { PrefixedLinkProps } from "./props";
  import Link from "./Link.svelte";
  import Prefix from "./Prefix.svelte";

  const { props }: { props: PrefixedLinkProps } = $props();
</script>

<!--
  @component
  A component that represents a link with a prefix.
-->
<div class="nav-link-header-link-container nav-link-header-prefixed">
  <Prefix props={props.prefix} />
  <Link props={props.link} />
</div>

<style>
  .nav-link-header-link-container {
    display: flex;
    flex-wrap: wrap;
  }
</style>
