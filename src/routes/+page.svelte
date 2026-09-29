<script lang="ts">
	import { onMount } from 'svelte';
	import LensCard from '$lib/components/LensCard.svelte';
	import ProfilePanel from '$lib/components/ProfilePanel.svelte';
	import PurchaseForm from '$lib/components/PurchaseForm.svelte';
	import RetirementChart from '$lib/components/RetirementChart.svelte';
	import { buildRetirementSeries } from '$lib/chart/retirementSeries';
	import { DEFAULT_DRAFT, toPurchase } from '$lib/draft';
	import type { Profile } from '$lib/finance/types';
	import { evaluate, GROUP_TITLES, type Group } from '$lib/lenses';
	import { summarise } from '$lib/lenses/summary';
	import { DEFAULT_PROFILE, FIELD_LABELS, loadProfile, saveProfile } from '$lib/profile';

	const FEATURED = 'retirement-delay';
	const GROUP_ORDER: Group[] = ['time', 'wealth', 'future', 'budget'];

	let draft = $state({ ...DEFAULT_DRAFT });
	let profile = $state<Profile>({ ...DEFAULT_PROFILE });
	let profileOpen = $state(false);
	let loaded = false;

	onMount(() => {
		profile = loadProfile();
		loaded = true;
	});

	$effect(() => {
		const snapshot = $state.snapshot(profile);
		if (loaded) saveProfile(snapshot);
	});

	const effectiveProfile = $derived<Profile>({
		...profile,
		realReturn: profile.realReturn ?? DEFAULT_PROFILE.realReturn,
		swr: profile.swr ?? DEFAULT_PROFILE.swr
	});

	const purchase = $derived(toPurchase(draft));
	const evaluation = $derived(evaluate(effectiveProfile, purchase));
	const summary = $derived(summarise(evaluation.results, purchase));
	const chartSeries = $derived(
		evaluation.retirement ? buildRetirementSeries(evaluation.retirement) : null
	);
	const featured = $derived(evaluation.results.find((r) => r.lens.id === FEATURED));
	const featuredLocked = $derived(evaluation.locked.find((l) => l.lens.id === FEATURED));
	const groups = $derived(
		GROUP_ORDER.map((group) => ({
			group,
			items: evaluation.results.filter((r) => r.lens.group === group && r.lens.id !== FEATURED)
		})).filter((g) => g.items.length > 0)
	);
	const missingFields = $derived([...new Set(evaluation.locked.flatMap((l) => l.missing))]);
	const hasAmount = $derived((draft.amount ?? 0) > 0);

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
		<button
			type="button"
			class="shrink-0 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800"
			onclick={() => (profileOpen = true)}
		>
			Your profile
		</button>
	</header>

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

			{#if featured}
				<LensCard lens={featured.lens} result={featured.result} featured>
					{#if chartSeries}
						<RetirementChart series={chartSeries} />
					{/if}
				</LensCard>
			{:else if featuredLocked}
				<button
					type="button"
					class="w-full rounded-2xl border-2 border-dashed border-stone-300 p-6 text-left hover:border-emerald-600 dark:border-stone-700"
					onclick={() => (profileOpen = true)}
				>
					<span class="block font-medium">How much later could you retire?</span>
					<span class="mt-1 block text-sm text-stone-600 dark:text-stone-400">
						Add your {listFields(featuredLocked.missing)} to see.
					</span>
				</button>
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

			{#if missingFields.length > 0}
				<p class="text-center text-sm text-stone-500 dark:text-stone-400">
					{evaluation.locked.length} more
					{evaluation.locked.length === 1 ? 'view' : 'views'} available.
					<button
						type="button"
						class="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 dark:text-emerald-400"
						onclick={() => (profileOpen = true)}>Add your {listFields(missingFields)}</button
					>
				</p>
			{/if}
		</div>
	{/if}
</div>

<ProfilePanel bind:profile bind:open={profileOpen} />
