<script lang="ts">
	import type { InfoNote } from '$lib/info';

	let {
		id,
		info,
		surface = 'bg-stone-50 dark:bg-stone-950'
	}: { id: string; info: InfoNote; surface?: string } = $props();
</script>

<div {id} class="mt-3 rounded-lg p-3 text-sm text-stone-700 dark:text-stone-300 {surface}">
	<p>
		<a
			href={info.href}
			target="_blank"
			rel="noopener noreferrer"
			class="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 dark:text-emerald-400"
			>{info.linkText}</a
		>
		{info.text}
	</p>
</div>
