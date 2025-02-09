<script lang="ts">
	import { NavigationLinkState } from "../navigationLinkState";
	import Icon from "./Icon.svelte";
	import type { NavLinkHeaderSettings } from "../settings";

	const {
		state,
		settings,
	}: { state: NavigationLinkState; settings: NavLinkHeaderSettings } =
		$props();
</script>

<!--
  @component
  A component that represents a link to a note.

  If `state.enabled` is `false`, the placeholder icon will be displayed instead of the link.
  If `state.fileExists` is `false`, the link will be rendered as an unresolved link.
-->
{#if state.enabled}
	{#if state.annotation}
		{#if state.isPropertyLink}
			{#each settings?.propertyMappings || [] as mapping}
				{#if mapping.property === state.annotation}
					<span>{mapping.emoji || "⬆️"}</span>
				{/if}
			{/each}
		{:else}
			<span>{state.annotation}</span>
		{/if}
	{/if}
	<a
		class:non-existent={!state.fileExists}
		href="#top"
		onclick={(e) => {
			e.preventDefault();
			state.clickHandler?.(state, e);
		}}
		onmousedown={(e) => {
			// 阻止中键点击的默认滚动行为
			if (e.button === 1) {
				e.preventDefault();
			}
		}}
		onauxclick={(e) => {
			// 处理中键点击，模拟 Ctrl+点击行为
			if (e.button === 1) {
				const simulatedEvent = new MouseEvent("click", {
					...e,
					ctrlKey: true,
				});
				state.clickHandler?.(state, simulatedEvent);
			}
		}}
		onmouseover={(e) => {
			state.mouseOverHandler?.(state, e);
		}}
		onfocus={() => {}}
		>{settings?.usePropertyAsDisplayName && state.propertyValue
			? state.displayTitle
			: state.title}</a
	>
{:else}
	<Icon iconId="minus" muted />
{/if}

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
