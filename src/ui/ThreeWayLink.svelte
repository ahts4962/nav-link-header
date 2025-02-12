<script lang="ts">
	import { ThreeWayLinkState } from "../navigationLinkState";
	import NavigationLink from "./NavigationLink.svelte";
	import Icon from "./Icon.svelte";

	const { state }: { state: ThreeWayLinkState } = $props();
</script>

<!-- 
  @component
  A component that represents a composite link that includes previous, next, and parent links.

  For each of previous, next, and parent, if `link` of the state object is `undefined`
  and `hidden` is `false`, a placeholder is displayed. If `hidden` is `true`, nothing is displayed.
-->
<Icon iconId="chevrons-left" />
{#if !state.previous.hidden}
	{#if state.previous.link}
		<NavigationLink state={state.previous.link} />
	{:else}
		<Icon iconId="minus" muted />
	{/if}
{/if}
{#if !state.parent.hidden && !state.previous.hidden}
	<span class="separator">|</span>
{/if}
{#if !state.parent.hidden}
	{#if state.parent.link}
		<NavigationLink state={state.parent.link} />
	{:else}
		<Icon iconId="minus" muted />
	{/if}
{/if}
{#if !state.next.hidden && (!state.previous.hidden || !state.parent.hidden)}
	<span class="separator">|</span>
{/if}
{#if !state.next.hidden}
	{#if state.next.link}
		<NavigationLink state={state.next.link} />
	{:else}
		<Icon iconId="minus" muted />
	{/if}
{/if}
<Icon iconId="chevrons-right" />

<style>
	.separator {
		margin-inline: 0.2em;
	}
</style>
