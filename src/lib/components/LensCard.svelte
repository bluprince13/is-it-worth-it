<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Lens, LensResult } from '$lib/lenses';

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
			<button
				type="button"
				aria-label="More about {lens.title.toLowerCase()}"
				aria-expanded={infoOpen}
				aria-controls={infoId}
				class="-m-1 flex size-7 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
				onclick={() => (infoOpen = !infoOpen)}
			>
				<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-4">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
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
			<div
				id={infoId}
				class="mt-3 rounded-lg bg-stone-50 p-3 text-sm text-stone-700 dark:bg-stone-950 dark:text-stone-300"
			>
				<p>
					<a
						href={result.info.href}
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 dark:text-emerald-400"
						>{result.info.linkText}</a
					>
					{result.info.text}
				</p>
			</div>
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
