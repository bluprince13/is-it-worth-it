<script lang="ts">
	interface Props {
		id: string;
		label: string;
		hint?: string;
		value: number | undefined;
		/** Shown greyed out when empty; in stored units, like value. */
		placeholder?: number;
		error?: string;
		/** Displayed value = stored value × scale (e.g. 100 for percentages). */
		scale?: number;
		prefix?: string;
		suffix?: string;
		step?: number | 'any';
	}

	let {
		id,
		label,
		hint,
		value = $bindable(),
		placeholder,
		error,
		scale = 1,
		prefix,
		suffix,
		step = 'any'
	}: Props = $props();

	const toDisplay = (v: number | undefined) =>
		v === undefined ? undefined : Math.round(v * scale * 1e6) / 1e6;
	const describedBy = $derived(
		[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
	);
	const fromDisplay = (v: number | null | undefined) =>
		v == null || Number.isNaN(v) ? undefined : v / scale;
</script>

<div>
	<label for={id} class="block text-sm font-medium text-stone-800 dark:text-stone-200"
		>{label}</label
	>
	{#if hint}
		<p id="{id}-hint" class="text-xs text-stone-500 dark:text-stone-400">{hint}</p>
	{/if}
	<div
		class="mt-1 flex items-center rounded-lg border bg-white focus-within:ring-1 dark:bg-stone-900 {error
			? 'border-rose-500 focus-within:border-rose-500 focus-within:ring-rose-500'
			: 'border-stone-300 focus-within:border-emerald-600 focus-within:ring-emerald-600 dark:border-stone-700'}"
	>
		{#if prefix}<span class="pl-3 text-stone-500">{prefix}</span>{/if}
		<input
			{id}
			type="number"
			inputmode="decimal"
			{step}
			placeholder={placeholder === undefined ? undefined : String(toDisplay(placeholder))}
			aria-describedby={describedBy}
			aria-invalid={error ? true : undefined}
			class="w-full min-w-0 border-0 bg-transparent px-3 py-2 tabular-nums focus:ring-0"
			bind:value={() => toDisplay(value), (v) => (value = fromDisplay(v))}
		/>
		{#if suffix}<span class="pr-3 text-sm text-stone-500">{suffix}</span>{/if}
	</div>
	{#if error}
		<p id="{id}-error" class="mt-1 text-xs text-rose-700 dark:text-rose-400">{error}</p>
	{/if}
</div>
