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

	// Link-preview crawlers need absolute URLs.
	const SITE_URL = 'https://bluprince13.com/apps/is-it-worth-it';
	const DESCRIPTION =
		'What a purchase costs you based on your income, wealth and retirement target.';
	const FEATURED = 'retirement-delay';
	const GROUP_ORDER: Group[] = ['income', 'wealth', 'retirement'];

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
	const draftErrors = $derived(validateDraft(draft, withTypical.profile.netWorth));
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
		})).filter((g) => g.items.length > 0 || g.group === featured?.lens.group)
	);
	const hasAmount = $derived((draft.amount ?? 0) > 0 && !draftErrors.amount);

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
	<meta name="description" content={DESCRIPTION} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Is it worth it?" />
	<meta property="og:title" content="Is it worth it?" />
	<meta property="og:description" content={DESCRIPTION} />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:image" content={`${SITE_URL}/og-image.png`} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={`Is it worth it? ${DESCRIPTION}`} />
	<meta name="twitter:card" content="summary_large_image" />
	<link rel="canonical" href={SITE_URL} />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 pt-8 pb-16 sm:pt-12">
	<header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Is it worth it?</h1>
			<p class="mt-1 text-stone-600 dark:text-stone-400">{DESCRIPTION}</p>
		</div>
		<div class="relative flex shrink-0 gap-2 self-end sm:self-auto">
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

	<PurchaseForm bind:draft netWorth={withTypical.profile.netWorth} />

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

			{#each groups as { group, items } (group)}
				<section aria-labelledby="group-{group}">
					<h2
						id="group-{group}"
						class="mb-3 text-xs font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400"
					>
						{GROUP_TITLES[group]}
					</h2>
					{#if featured && group === featured.lens.group}
						<div class="mb-4">{@render card(featured, true)}</div>
					{/if}
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
					aria-invalid={draftErrors.investYears ? true : undefined}
					aria-describedby={draftErrors.investYears ? 'invest-years-error' : undefined}
					class="w-20 rounded-lg bg-white py-1.5 tabular-nums dark:bg-stone-900 {draftErrors.investYears
						? 'border-rose-500'
						: 'border-stone-300 dark:border-stone-700'}"
					bind:value={draft.investYears}
				/>
				<span class="text-stone-600 dark:text-stone-300">years</span>
			</div>
			{#if draftErrors.investYears}
				<p id="invest-years-error" class="text-xs text-rose-700 dark:text-rose-400">
					{draftErrors.investYears}
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
	<div class="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
		<p>
			Created by
			<a
				href="https://bluprince13.com"
				class="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 dark:text-emerald-400"
				>bluprince13</a
			>
		</p>
		<a
			href="https://github.com/bluprince13/is-it-worth-it"
			class="inline-flex items-center gap-1.5 font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 dark:text-emerald-400"
		>
			<svg viewBox="0 0 16 16" class="h-3.5 w-3.5 fill-current" aria-hidden="true">
				<path
					d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
				/>
			</svg>
			Source on GitHub
		</a>
	</div>
</footer>

<ProfilePanel bind:profile bind:open={profileOpen} />
