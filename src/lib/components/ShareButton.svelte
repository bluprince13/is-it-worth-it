<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';

	let { link, class: className }: { link: () => string; class: string } = $props();

	const COPIED_MS = 4000;

	let status = $state<{ kind: 'copied' } | { kind: 'manual'; url: string } | null>(null);
	let timer: ReturnType<typeof setTimeout>;

	async function share() {
		const url = link();
		clearTimeout(timer);
		try {
			await navigator.clipboard.writeText(url);
			status = { kind: 'copied' };
			timer = setTimeout(() => (status = null), COPIED_MS);
		} catch {
			status = { kind: 'manual', url };
		}
	}

	onDestroy(() => clearTimeout(timer));
</script>

<!-- The popover anchors to the nearest positioned ancestor, so the parent decides its alignment. -->
<div>
	<button type="button" class={className} onclick={share}>Share</button>

	<div role="status" class="absolute top-full right-0 z-20 mt-2 w-72">
		{#if status}
			<div
				transition:fade={{ duration: 150 }}
				class="rounded-xl border border-stone-200 bg-white p-3 text-sm shadow-lg dark:border-stone-700 dark:bg-stone-800"
			>
				{#if status.kind === 'copied'}
					<p class="font-medium">Link copied</p>
					<p class="mt-0.5 text-stone-500 dark:text-stone-400">
						It includes your profile figures, so anyone with the link can see them.
					</p>
				{:else}
					<div class="flex items-start justify-between gap-2">
						<label for="share-url" class="font-medium">Copy this link to share</label>
						<button
							type="button"
							aria-label="Close"
							class="-mt-1 -mr-1 rounded px-1.5 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700"
							onclick={() => (status = null)}>×</button
						>
					</div>
					<p class="mt-0.5 text-stone-500 dark:text-stone-400">
						It includes your profile figures, so anyone with the link can see them.
					</p>
					<input
						id="share-url"
						readonly
						value={status.url}
						onfocus={(e) => e.currentTarget.select()}
						class="mt-2 w-full rounded-lg border-stone-300 bg-stone-50 text-xs dark:border-stone-700 dark:bg-stone-950"
					/>
				{/if}
			</div>
		{/if}
	</div>
</div>
