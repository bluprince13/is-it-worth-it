<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import LensCard from '$lib/components/LensCard.svelte';
	import ProfilePanel from '$lib/components/ProfilePanel.svelte';
	import PurchaseForm from '$lib/components/PurchaseForm.svelte';
	import RetirementChart from '$lib/components/RetirementChart.svelte';
	import { buildRetirementSeries } from '$lib/chart/retirementSeries';
	import { DEFAULT_DRAFT, EXAMPLES, toPurchase } from '$lib/draft';
	import type { Profile } from '$lib/finance/types';
	import { evaluate, GROUP_TITLES, type Group } from '$lib/lenses';
	import { summarise } from '$lib/lenses/summary';
	import {
		DEFAULT_PROFILE,
		FIELD_LABELS,
		loadProfile,
		saveProfile,
		withDefaults
	} from '$lib/profile';
	import { decodeShare, encodeShare } from '$lib/share';

	const FEATURED = 'retirement-delay';
	const GROUP_ORDER: Group[] = ['time', 'wealth', 'future', 'budget'];

	let draft = $state({ ...DEFAULT_DRAFT });
	let profile = $state<Profile>({ ...DEFAULT_PROFILE });
	let profileOpen = $state(false);
	let loaded = false;
	/** True while showing figures from a shared link, which must not overwrite the viewer's own. */
	let profileFromLink = $state(false);
	let shareStatus = $state<{ kind: 'copied' } | { kind: 'manual'; url: string } | null>(null);
	let shareTimer: ReturnType<typeof setTimeout>;

	onMount(() => {
		const shared = decodeShare(location.search);
		if (shared.draft) draft = shared.draft;
		if (shared.profile) {
			profile = { ...DEFAULT_PROFILE, ...shared.profile };
			profileFromLink = true;
		} else {
			profile = loadProfile();
		}
		loaded = true;
		// SvelteKit refuses replaceState until hydration finishes, which is after onMount.
		if (location.search) setTimeout(() => replaceState(location.pathname, {}));
	});

	$effect(() => {
		const snapshot = $state.snapshot(profile);
		if (loaded && !profileFromLink) saveProfile(snapshot);
	});

	function keepLinkProfile() {
		profileFromLink = false;
	}

	function useOwnProfile() {
		profile = loadProfile();
		profileFromLink = false;
	}

	async function share() {
		const url = `${location.origin}${location.pathname}?${encodeShare(draft, profile)}`;
		clearTimeout(shareTimer);
		try {
			await navigator.clipboard.writeText(url);
			shareStatus = { kind: 'copied' };
			shareTimer = setTimeout(() => (shareStatus = null), 5000);
		} catch {
			shareStatus = { kind: 'manual', url };
		}
	}

	const withTypical = $derived(withDefaults(profile));

	const purchase = $derived(toPurchase(draft));
	const evaluation = $derived(evaluate(withTypical.profile, purchase));
	const summary = $derived(summarise(evaluation.results, purchase));
	const chartSeries = $derived(
		evaluation.retirement ? buildRetirementSeries(evaluation.retirement) : null
	);
	const featured = $derived(evaluation.results.find((r) => r.lens.id === FEATURED));
	const groups = $derived(
		GROUP_ORDER.map((group) => ({
			group,
			items: evaluation.results.filter((r) => r.lens.group === group && r.lens.id !== FEATURED)
		})).filter((g) => g.items.length > 0)
	);
	const hasAmount = $derived((draft.amount ?? 0) > 0);

	const headerButton =
		'rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800';

	function listFields(keys: (keyof Profile)[]): string {
		const labels = keys.map((k) => FIELD_LABELS[k].toLowerCase());
		return labels.length > 1
			? `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`
			: (labels[0] ?? '');
	}
</script>

<svelte:head>
	<title>Is it worth it?</title>
	<meta
		name="description"
		content="See what a purchase really costs you: in hours of work, wealth and how much later you can retire."
	/>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 pt-8 pb-16 sm:pt-12">
	<header class="mb-8 flex items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Is it worth it?</h1>
			<p class="mt-1 text-stone-600 dark:text-stone-400">
				What a purchase really costs you, in time, wealth and retirement.
			</p>
		</div>
		<div class="flex shrink-0 gap-2">
			<button type="button" class={headerButton} onclick={share}>Share</button>
			<button type="button" class={headerButton} onclick={() => (profileOpen = true)}>
				Your profile
			</button>
		</div>
	</header>

	{#if shareStatus}
		<div
			role="status"
			class="mb-6 rounded-xl border border-stone-200 bg-white p-4 text-sm dark:border-stone-800 dark:bg-stone-900"
		>
			{#if shareStatus.kind === 'copied'}
				<p>
					<strong class="font-medium">Link copied.</strong>
					It includes your profile figures, so anyone with the link can see them.
				</p>
			{:else}
				<label for="share-url" class="block font-medium">Copy this link to share</label>
				<p class="text-stone-500 dark:text-stone-400">
					It includes your profile figures, so anyone with the link can see them.
				</p>
				<input
					id="share-url"
					readonly
					value={shareStatus.url}
					onfocus={(e) => e.currentTarget.select()}
					class="mt-2 w-full rounded-lg border-stone-300 bg-stone-50 text-xs dark:border-stone-700 dark:bg-stone-950"
				/>
			{/if}
		</div>
	{/if}

	{#if profileFromLink}
		<div
			role="status"
			class="mb-6 flex flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-sky-900 dark:bg-sky-950"
		>
			<p>You're seeing the figures from a shared link. They won't be saved unless you keep them.</p>
			<div class="flex shrink-0 gap-2">
				<button type="button" class={headerButton} onclick={keepLinkProfile}>Keep these</button>
				<button type="button" class={headerButton} onclick={useOwnProfile}>Use my own</button>
			</div>
		</div>
	{/if}

	<div class="mb-3 flex flex-wrap items-center gap-2 text-sm">
		<span class="text-stone-500 dark:text-stone-400">Try:</span>
		{#each EXAMPLES as example (example.label)}
			<button
				type="button"
				class="rounded-full border border-stone-300 px-3 py-1 hover:border-emerald-600 hover:text-emerald-700 dark:border-stone-700 dark:hover:text-emerald-400"
				onclick={() => (draft = { ...example })}>{example.label}</button
			>
		{/each}
	</div>

	<PurchaseForm bind:draft />

	{#if !hasAmount}
		<p class="mt-10 text-center text-stone-500 dark:text-stone-400">
			Enter an amount to see what it's really worth to you.
		</p>
	{:else}
		<div class="mt-8 space-y-10">
			{#if summary}
				<p class="text-xl leading-snug font-medium text-balance sm:text-2xl" aria-live="polite">
					{summary}
				</p>
			{/if}

			{#if withTypical.defaulted.length > 0}
				<p class="-mt-6 text-sm text-stone-500 dark:text-stone-400">
					Using typical UK figures for your {listFields(withTypical.defaulted)}.
					<button
						type="button"
						class="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 dark:text-emerald-400"
						onclick={() => (profileOpen = true)}>Add your own</button
					> for a truer picture.
				</p>
			{/if}

			{#if featured}
				<LensCard lens={featured.lens} result={featured.result} featured>
					{#if chartSeries}
						<RetirementChart series={chartSeries} />
					{/if}
				</LensCard>
			{/if}

			{#each groups as { group, items } (group)}
				<section aria-labelledby="group-{group}">
					<h2
						id="group-{group}"
						class="mb-3 text-xs font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400"
					>
						{GROUP_TITLES[group]}
					</h2>
					<div class="grid gap-4 sm:grid-cols-2">
						{#each items as { lens, result } (lens.id)}
							<LensCard {lens} {result} />
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}
</div>

<ProfilePanel bind:profile bind:open={profileOpen} />
