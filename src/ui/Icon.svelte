<script lang="ts">
	import { setIcon } from "obsidian";
	import { onMount } from "svelte";

	export let iconId: string;
	export let muted: boolean = false;

	let container: HTMLDivElement;

	onMount(() => {
		setIcon(container, iconId);
	});
</script>

<!--
  @component
  A component representing an icon.

  The `iconId` property specifies the ID of the icon to render.
  Specify the ID of the Obsidian's built-in icons.

  The `muted` property indicates whether the icon is muted.
  The muted icon is rendered with a faint color.
-->
<div class="container" class:muted bind:this={container}></div>

<style>
	.container {
		display: inline-block;
		vertical-align: middle;
		position: relative;
		top: -0.05em;
		color: var(--text-normal);

		& > svg {
			display: block;
		}
	}

	.muted {
		color: var(--text-faint);
	}
</style>
