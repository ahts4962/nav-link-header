<script lang="ts">
  import type { LinkProps } from "./props";
  import Icon from "./Icon.svelte";

  const { props }: { props: LinkProps } = $props();
</script>

<!--
  @component
  A component that represents a link.

  If `props.linkInfo.isResolved` is `false`, the link will be rendered as an unresolved link.
  If `props.linkInfo.isExternal` is `true`, an external link icon will be displayed
  next to the link.
-->
<div class="nav-link-header-link">
  <a
    class={[!props.linkInfo.isResolved && "nav-link-header-unresolved"]}
    href="#top"
    onclick={(e) => {
      e.preventDefault();
      props.clickHandler(props, e);
    }}
    onauxclick={(e) => {
      e.preventDefault();
      props.clickHandler(props, e);
    }}
    onmouseover={(e) => {
      props.mouseOverHandler(props, e);
    }}
    onfocus={() => {}}>{props.linkInfo.displayText}</a
  >
  {#if props.linkInfo.isExternal}
    <Icon iconId="external-link" muted size="var(--icon-xs)" />
  {/if}
</div>

<style>
  .nav-link-header-link {
    display: inline-flex;
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
