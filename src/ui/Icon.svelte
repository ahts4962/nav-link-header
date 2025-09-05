<script lang="ts">
	import { setIcon } from "obsidian";
	import { onMount } from "svelte";

	const {
		iconId,
		muted = false,
		size = "var(--icon-m)",
	}: { iconId: string; muted?: boolean; size?: string } = $props();

	let container: HTMLDivElement;

	onMount(() => {
		setIcon(container, iconId);
	});
</script>

<!--
  @component
  A component representing an icon.

  The `iconId` property specifies the ID of the icon to render.
  The ID of the Obsidian's built-in icons are used.

  The `muted` property indicates whether the icon is muted.
  The muted icon is rendered with a faint color.

  The `size` property specifies the size of the icon.
  It can be a CSS size value like "16px", "1.5em", or a custom size defined in CSS variables
  like "var(--icon-m)". The default size is "var(--icon-m)".
-->
<div
	class={["nav-link-header-container", muted && "nav-link-header-muted"]}
	bind:this={container}
	style={`--icon-size: ${size};`}
></div>

<style>
	.nav-link-header-container {
		display: inline-block;
		vertical-align: middle;
		color: var(--text-normal);

		& > :global(svg) {
			display: block;
		}
	}

	.nav-link-header-muted {
		color: var(--text-faint);
	}
</style>
