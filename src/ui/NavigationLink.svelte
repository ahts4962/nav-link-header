<script lang="ts">
	import { NavigationLinkState } from "../navigationLinkState";

	const { state }: { state: NavigationLinkState } = $props();
</script>

<!--
  @component
  A component that represents a link to a note.

  If `state.resolved` is `false`, the link will be rendered as an unresolved link.
-->
<a
	class={[!state.resolved && "unresolved"]}
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

<style>
	.unresolved {
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
