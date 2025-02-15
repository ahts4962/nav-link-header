<script lang="ts">
	import type { PrefixedLinkState } from "../navigationLinkState";
	import NavigationLink from "./NavigationLink.svelte";

	const { state }: { state: PrefixedLinkState } = $props();
</script>

<!--
  @component
  A component that represents a link with a prefix string (typically emoji).
-->
<span>{state.prefix}</span><NavigationLink state={state.link} />
