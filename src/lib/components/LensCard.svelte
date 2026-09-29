<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Lens, LensResult, Severity } from '$lib/lenses';
	import { SEVERITY_LABELS } from '$lib/lenses/thresholds';

	let {
		lens,
		result,
		featured = false,
		children
	}: { lens: Lens; result: LensResult; featured?: boolean; children?: Snippet } = $props();

	const SEVERITY_STYLES: Record<Severity, string> = {
		0: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
		1: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
		2: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
		3: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
	};
</script>

<article
	class="flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 {featured
		? 'sm:p-7'
		: ''}"
>
	<header class="flex items-start justify-between gap-3">
		<h3 class="text-sm font-medium text-stone-500 dark:text-stone-400">{lens.title}</h3>
		{#if result.severity !== undefined}
			<span
				class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium {SEVERITY_STYLES[
					result.severity
				]}">{SEVERITY_LABELS[result.severity]}</span
			>
		{/if}
	</header>

	<p class="mt-2 leading-tight">
		<span
			class="font-semibold tracking-tight text-stone-900 tabular-nums dark:text-white {featured
				? 'text-4xl sm:text-5xl'
				: 'text-3xl'}">{result.headline}</span
		>
		<span class="block text-stone-600 dark:text-stone-300 {featured ? 'mt-1 text-lg' : ''}"
			>{result.caption}</span
		>
	</p>

	<p class="mt-3 text-sm text-stone-600 dark:text-stone-400">{result.sentence}</p>

	{@render children?.()}

	{#if result.working.length > 0}
		<details class="group mt-auto pt-3 text-sm">
			<summary
				class="cursor-pointer text-stone-500 select-none hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
			>
				How it's calculated
			</summary>
			<ul
				class="mt-2 space-y-1 rounded-lg bg-stone-50 p-3 font-mono text-xs text-stone-700 dark:bg-stone-950 dark:text-stone-300"
			>
				{#each result.working as line, i (i)}
					<li>{line}</li>
				{/each}
			</ul>
		</details>
	{/if}
</article>
