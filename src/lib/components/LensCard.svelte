<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Lens, LensResult } from '$lib/lenses';

	type Props = {
		lens: Lens;
		featured?: boolean;
		children?: Snippet;
	} & ({ result: LensResult; error?: never } | { result?: never; error: Snippet });

	let { lens, result, error, featured = false, children }: Props = $props();
</script>

<article
	class="flex flex-col rounded-2xl border bg-white p-5 shadow-sm dark:bg-stone-900 {error
		? 'border-rose-300 dark:border-rose-900'
		: 'border-stone-200 dark:border-stone-800'} {featured ? 'sm:p-7' : ''}"
>
	<header class="flex items-start justify-between gap-3">
		<h3 class="text-sm font-medium text-stone-500 dark:text-stone-400">{lens.title}</h3>
	</header>

	{#if error}
		<div class="mt-2 text-sm text-rose-700 dark:text-rose-400">{@render error()}</div>
	{:else if result}
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
	{/if}
</article>
