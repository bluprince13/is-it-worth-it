<script lang="ts">
	import { FREQUENCY_PRESETS, toPurchase, validateDraft, type PurchaseDraft } from '$lib/draft';
	import { annualCost } from '$lib/finance/recurrence';
	import type { Duration, Unit } from '$lib/finance/types';
	import { formatDuration, formatMoney } from '$lib/format';
	import Segmented from './Segmented.svelte';

	let { draft = $bindable() }: { draft: PurchaseDraft } = $props();

	let customFrequency = $state(false);

	$effect.pre(() => {
		void draft;
		customFrequency = false;
	});

	const presetKey = (every: number, unit: Unit) => `${every}-${unit}`;

	const frequencyOptions = [
		...FREQUENCY_PRESETS.map((p) => ({
			value: presetKey(p.recurrence.every, p.recurrence.unit),
			label: p.label
		})),
		{ value: 'custom', label: 'Custom' }
	];

	const frequencyKey = $derived.by(() => {
		const key = presetKey(draft.every, draft.unit);
		return customFrequency || !frequencyOptions.some((o) => o.value === key) ? 'custom' : key;
	});

	function selectFrequency(key: string) {
		customFrequency = key === 'custom';
		const preset = FREQUENCY_PRESETS.find(
			(p) => presetKey(p.recurrence.every, p.recurrence.unit) === key
		);
		if (preset) {
			draft.every = preset.recurrence.every;
			draft.unit = preset.recurrence.unit;
		}
	}

	const durationOptions: { value: Duration['kind']; label: string }[] = [
		{ value: 'fixed', label: 'For a while' },
		{ value: 'untilFI', label: 'Until I retire' }
	];

	const purchase = $derived(toPurchase(draft));
	const errors = $derived(validateDraft(draft));

	const smallInput = (error: string | undefined) =>
		`w-20 rounded-lg bg-white py-1.5 tabular-nums dark:bg-stone-900 ${error ? 'border-rose-500' : 'border-stone-300 dark:border-stone-700'}`;
</script>

<section
	class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6 dark:border-stone-800 dark:bg-stone-900"
>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-end">
		<div class="sm:w-56">
			<label for="amount" class="block text-sm font-medium text-stone-600 dark:text-stone-300"
				>Amount</label
			>
			<div
				class="mt-1 flex items-center rounded-xl border bg-stone-50 focus-within:ring-1 dark:bg-stone-950 {errors.amount
					? 'border-rose-500 focus-within:ring-rose-500'
					: 'border-stone-300 focus-within:border-emerald-600 focus-within:ring-emerald-600 dark:border-stone-700'}"
			>
				<span class="pl-4 text-2xl text-stone-400">£</span>
				<input
					id="amount"
					type="number"
					inputmode="decimal"
					min="0"
					step="any"
					placeholder="0"
					aria-invalid={errors.amount ? true : undefined}
					aria-describedby={errors.amount ? 'amount-error' : undefined}
					class="w-full min-w-0 border-0 bg-transparent py-2 pr-4 pl-1 text-3xl font-semibold tabular-nums focus:ring-0"
					bind:value={
						() => draft.amount, (v) => (draft.amount = v == null || Number.isNaN(v) ? undefined : v)
					}
				/>
			</div>
			{#if errors.amount}
				<p id="amount-error" class="mt-1 text-xs text-rose-700 dark:text-rose-400">
					{errors.amount}
				</p>
			{/if}
		</div>
		<div class="flex-1">
			<label for="label" class="block text-sm font-medium text-stone-600 dark:text-stone-300"
				>For <span class="font-normal text-stone-400">(optional)</span></label
			>
			<input
				id="label"
				type="text"
				placeholder="e.g. new bike, Netflix"
				class="mt-1 w-full rounded-xl border-stone-300 bg-stone-50 px-4 py-3 focus:border-emerald-600 focus:ring-emerald-600 dark:border-stone-700 dark:bg-stone-950"
				bind:value={draft.label}
			/>
		</div>
	</div>

	<div class="mt-5">
		<Segmented
			label="How often"
			options={[
				{ value: 'once', label: 'One-off' },
				{ value: 'recurring', label: 'Recurring' }
			]}
			bind:value={
				() => (draft.recurring ? 'recurring' : 'once'), (v) => (draft.recurring = v === 'recurring')
			}
		/>
	</div>

	{#if draft.recurring}
		<div class="mt-5 grid gap-5 border-t border-stone-200 pt-5 dark:border-stone-800">
			<fieldset>
				<legend class="mb-2 text-sm font-medium text-stone-600 dark:text-stone-300">Every</legend>
				<Segmented
					label="Frequency"
					options={frequencyOptions}
					bind:value={() => frequencyKey, selectFrequency}
				/>
				{#if frequencyKey === 'custom'}
					<div class="mt-3 flex items-center gap-2">
						<span class="text-sm text-stone-600 dark:text-stone-300">Every</span>
						<input
							type="number"
							min="1"
							step="1"
							aria-label="Number of units between payments"
							aria-invalid={errors.every ? true : undefined}
							aria-describedby={errors.every ? 'every-error' : undefined}
							class={smallInput(errors.every)}
							bind:value={draft.every}
						/>
						<select
							aria-label="Unit"
							class="rounded-lg border-stone-300 bg-white py-1.5 dark:border-stone-700 dark:bg-stone-900"
							bind:value={draft.unit}
						>
							<option value="day">days</option>
							<option value="week">weeks</option>
							<option value="month">months</option>
							<option value="year">years</option>
						</select>
					</div>
					{#if errors.every}
						<p id="every-error" class="mt-1 text-xs text-rose-700 dark:text-rose-400">
							{errors.every}
						</p>
					{/if}
				{/if}
			</fieldset>

			<fieldset>
				<legend class="mb-2 text-sm font-medium text-stone-600 dark:text-stone-300">How long</legend
				>
				<Segmented label="Duration" options={durationOptions} bind:value={draft.durationKind} />
				{#if draft.durationKind === 'fixed'}
					<div class="mt-3 flex items-center gap-2">
						<span class="text-sm text-stone-600 dark:text-stone-300">For</span>
						<input
							type="number"
							min="1"
							step="1"
							aria-label="Duration length"
							aria-invalid={errors.durationCount ? true : undefined}
							aria-describedby={errors.durationCount ? 'duration-error' : undefined}
							class={smallInput(errors.durationCount)}
							bind:value={draft.durationCount}
						/>
						<select
							aria-label="Duration unit"
							class="rounded-lg border-stone-300 bg-white py-1.5 dark:border-stone-700 dark:bg-stone-900"
							bind:value={draft.durationUnit}
						>
							<option value="year">years</option>
							<option value="month">months</option>
						</select>
					</div>
					{#if errors.durationCount}
						<p id="duration-error" class="mt-1 text-xs text-rose-700 dark:text-rose-400">
							{errors.durationCount}
						</p>
					{/if}
				{/if}
			</fieldset>

			{#if purchase.amount > 0 && purchase.duration}
				<p class="text-sm text-stone-600 dark:text-stone-300">
					= <strong class="font-semibold text-stone-900 dark:text-white"
						>{formatMoney(annualCost(purchase))} a year</strong
					>, {formatDuration(purchase.duration)}
				</p>
			{/if}
		</div>
	{/if}
</section>
