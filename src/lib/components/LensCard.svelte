<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Lens, LensResult } from '$lib/lenses';
	import InfoButton from './InfoButton.svelte';
	import InfoPanel from './InfoPanel.svelte';

	type Props = {
		lens: Lens;
		featured?: boolean;
		children?: Snippet;
	} & ({ result: LensResult; error?: never } | { result?: never; error: Snippet });

	let { lens, result, error, featured = false, children }: Props = $props();

	const infoId = $props.id();
	let infoOpen = $state(false);
</script>

<article
	class="flex flex-col rounded-2xl border bg-white p-5 shadow-sm dark:bg-stone-900 {error
		? 'border-rose-300 dark:border-rose-900'
		: 'border-stone-200 dark:border-stone-800'} {featured ? 'sm:p-7' : ''}"
>
	<header class="flex items-start justify-between gap-3">
		<h3 class="text-sm font-medium text-stone-500 dark:text-stone-400">{lens.title}</h3>
		{#if result?.info}
			<InfoButton
				label="More about {lens.title.toLowerCase()}"
				controls={infoId}
				bind:expanded={infoOpen}
			/>
		{/if}
	</header>

	{#if error}
		<div class="mt-2 text-sm text-rose-700 dark:text-rose-400">{@render error()}</div>
		{@render children?.()}
	{:else if result}
		<p class="mt-2 leading-tight">
			<span
				class="font-semibold tracking-tight text-stone-900 tabular-nums dark:text-white {featured
					? 'text-4xl sm:text-5xl'
					: 'text-3xl'}">{result.headline}</span
			>
			{#if result.caption}
				<span class="block text-stone-600 dark:text-stone-300 {featured ? 'mt-1 text-lg' : ''}"
					>{result.caption}</span
				>
			{/if}
		</p>

		{#if result.sentence}
			<p class="mt-3 text-sm text-stone-600 dark:text-stone-400">{result.sentence}</p>
		{/if}

		{#if result.info && infoOpen}
			<InfoPanel id={infoId} info={result.info} />
		{/if}

		{@render children?.()}

		{#if result.working.length > 0}
			<details class="group mt-auto pt-3 text-sm">
				<summary
					class="cursor-pointer text-stone-500 select-none hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
				>
					How it's calculated
				</summary>
				<div
					class="mt-2 grid grid-cols-[fit-content(40%)_auto_minmax(0,1fr)] gap-x-2 gap-y-2 rounded-lg bg-stone-50 p-3 font-mono text-xs text-stone-700 dark:bg-stone-950 dark:text-stone-300"
				>
					{#each result.working as step, i (i)}
						<p class="col-span-3 grid grid-cols-subgrid gap-y-0.5">
							<span class="text-stone-500 dark:text-stone-400">{step.label}</span>
							<span>=</span>
							{#if step.expr}
								<span>{step.expr}</span>
								<span class="col-start-2">=</span>
							{/if}
							<span
								class={i === result.working.length - 1
									? 'font-semibold text-stone-900 dark:text-white'
									: ''}>{step.result}</span
							>
						</p>
					{/each}
				</div>
			</details>
		{/if}
	{/if}
</article>
