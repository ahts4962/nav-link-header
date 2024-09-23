<script lang="ts">
	import { NavigationLinkState } from "../navigationLinkState";

	export let state: NavigationLinkState;
</script>

<!--
  @component
  A component that represents a link to a note.

  The `state` property specifies the state of this component.
  When `state.fileExists` is `false`, the link will be rendered as an unresolved link.
-->
{#if state.annotation}
	<span>{state.annotation}</span>
{/if}
<a
	class:non-existent={!state.fileExists}
	href="#top"
	on:click={(e) => {
		state.clickHandler(state, e);
	}}
	on:mouseover={(e) => {
		state.mouseOverHandler(state, e);
	}}
	on:focus={() => {}}>{state.title}</a
>

<style>
	.non-existent {
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
