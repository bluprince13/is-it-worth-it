<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import FormattedNumberInput from '$lib/components/FormattedNumberInput.svelte';
	import LensCard from '$lib/components/LensCard.svelte';
	import ProfilePanel from '$lib/components/ProfilePanel.svelte';
	import PurchaseForm from '$lib/components/PurchaseForm.svelte';
	import RetirementChart from '$lib/components/RetirementChart.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { buildRetirementSeries } from '$lib/chart/retirementSeries';
	import {
		EXAMPLES,
		INITIAL_DRAFT,
		investYearsOption,
		toPurchase,
		validateDraft
	} from '$lib/draft';
	import Segmented from '$lib/components/Segmented.svelte';
	import type { Profile } from '$lib/finance/types';
	import {
		evaluate,
		GROUP_TITLES,
		LENSES,
		type Blocked,
		type Evaluated,
		type Group
	} from '$lib/lenses';
	import {
		DEFAULT_PROFILE,
		FIELD_LABELS,
		loadProfile,
		saveProfile,
		withDefaults
	} from '$lib/profile';
	import { decodeShare, encodeShare } from '$lib/share';

	const FEATURED = 'retirement-delay';
	const GROUP_ORDER: Group[] = ['time', 'wealth', 'future'];

	let draft = $state({ ...INITIAL_DRAFT });
	let profile = $state<Profile>({ ...DEFAULT_PROFILE });
	let profileOpen = $state(false);
	let loaded = false;
	/** True while showing figures from a shared link, which must not overwrite the viewer's own. */
	let profileFromLink = $state(false);

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

	const withTypical = $derived(withDefaults(profile));

	const purchase = $derived(toPurchase(draft));
	const investYears = $derived(investYearsOption(draft));
	const evaluation = $derived(
		evaluate(withTypical.profile, purchase, {
			investYears: investYears === undefined ? NaN : investYears
		})
	);
	const investYearsError = $derived(validateDraft(draft).investYears);
	const chartSeries = $derived(
		evaluation.retirement ? buildRetirementSeries(evaluation.retirement) : null
	);
	const cards = $derived(
		[...evaluation.results, ...evaluation.blocked].sort(
			(a, b) => LENSES.indexOf(a.lens) - LENSES.indexOf(b.lens)
		)
	);
	const featured = $derived(cards.find((c) => c.lens.id === FEATURED));
	const groups = $derived(
		GROUP_ORDER.map((group) => ({
			group,
			items: cards.filter((c) => c.lens.group === group && c.lens.id !== FEATURED)
		})).filter((g) => g.items.length > 0)
	);
	const hasAmount = $derived((draft.amount ?? 0) > 0);

	const headerButton =
		'rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800';
	const iconButton =
		'rounded-xl border border-stone-300 bg-white p-2 text-stone-600 shadow-sm hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800';

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
		content="See what a purchase costs you in hours of work, share of wealth and time to reach a retirement target."
	/>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 pt-8 pb-16 sm:pt-12">
	<header class="mb-8 flex items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Is it worth it?</h1>
			<p class="mt-1 text-stone-600 dark:text-stone-400">
				What a purchase costs you, measured in time, wealth and retirement.
			</p>
		</div>
		<div class="relative flex shrink-0 gap-2">
			<ThemeToggle class={iconButton} />
			<ShareButton
				class={headerButton}
				link={() => `${location.origin}${location.pathname}?${encodeShare(draft, profile)}`}
			/>
			<button type="button" class={headerButton} onclick={() => (profileOpen = true)}>
				Your profile
			</button>
		</div>
	</header>

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

	{#if hasAmount}
		<div class="mt-8 space-y-10">
			{#if withTypical.defaulted.length > 0}
				<p class="text-sm text-stone-500 dark:text-stone-400">
					This uses estimates for {FIELD_LABELS[withTypical.defaulted[0]].toLowerCase()}{withTypical
						.defaulted.length > 1
						? ' and other input parameters'
						: ''}.
					<button
						type="button"
						class="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 dark:text-emerald-400"
						onclick={() => (profileOpen = true)}>Add your own figures</button
					> to use them instead.
				</p>
			{/if}

			{#if featured}
				{@render card(featured, true)}
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
						{#each items as item (item.lens.id)}
							{@render card(item)}
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}
</div>

{#snippet card(item: Evaluated | Blocked, isFeatured = false)}
	{#if 'result' in item}
		<LensCard lens={item.lens} result={item.result} featured={isFeatured}>
			{#if isFeatured && chartSeries}
				<RetirementChart series={chartSeries} />
			{/if}
			{#if item.lens.id === 'future-value'}
				{@render investHorizon()}
			{/if}
		</LensCard>
	{:else}
		<LensCard lens={item.lens} featured={isFeatured}>
			{#if item.lens.id === 'future-value'}
				{@render investHorizon()}
			{/if}
			{#snippet error()}
				Can't be calculated because your {listFields(item.invalid)}
				{item.invalid.length === 1 ? "isn't" : "aren't"} valid.
				<button
					type="button"
					class="font-medium underline underline-offset-2"
					onclick={() => (profileOpen = true)}>Fix in your profile</button
				>
			{/snippet}
		</LensCard>
	{/if}
{/snippet}

{#snippet investHorizon()}
	<div class="mt-4 space-y-2">
		<Segmented
			label="Invest until"
			options={[
				{ value: 'target', label: 'Until retirement' },
				{ value: 'years', label: 'For N years' }
			]}
			bind:value={draft.investHorizon}
		/>
		{#if draft.investHorizon === 'years'}
			<div class="flex items-center gap-2 text-sm">
				<FormattedNumberInput
					inputmode="numeric"
					aria-label="Number of years to invest"
					aria-invalid={investYearsError ? true : undefined}
					aria-describedby={investYearsError ? 'invest-years-error' : undefined}
					class="w-20 rounded-lg bg-white py-1.5 tabular-nums dark:bg-stone-900 {investYearsError
						? 'border-rose-500'
						: 'border-stone-300 dark:border-stone-700'}"
					bind:value={draft.investYears}
				/>
				<span class="text-stone-600 dark:text-stone-300">years</span>
			</div>
			{#if investYearsError}
				<p id="invest-years-error" class="text-xs text-rose-700 dark:text-rose-400">
					{investYearsError}
				</p>
			{/if}
		{/if}
	</div>
{/snippet}

<footer class="mx-auto max-w-4xl px-4 pb-10 text-xs text-stone-500 dark:text-stone-400">
	<p>
		For illustration only, not financial advice. Results are calculations from the figures and
		assumptions entered, not forecasts.
	</p>
	<p class="mt-2">
		Created by
		<a
			href="https://bluprince13.com"
			class="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 dark:text-emerald-400"
			>bluprince13</a
		>
	</p>
</footer>

<ProfilePanel bind:profile bind:open={profileOpen} />
