<script lang="ts">
  import type { PrefixState } from "./states";

  const { state }: { state: PrefixState } = $props();
</script>

<!--
  @component
  A component that represents a prefix string (e.g., emoji).
-->
<button
  class="nav-link-header-link-prefix clickable-icon"
  onclick={(e) => {
    e.preventDefault();
    state.clickHandler(state);
  }}
>
  {state.label}
</button>

<style>
  .nav-link-header-link-prefix {
    all: unset;
    display: inline-block;
    border-radius: var(--radius-s);
    cursor: pointer;
    white-space: pre-wrap;

    &:hover {
      background-color: var(--background-modifier-hover);
    }
  }
</style>
