<script lang="ts" generics="T extends string">
	interface Props {
		label: string;
		options: { value: T; label: string }[];
		value: T;
	}

	let { label, options, value = $bindable() }: Props = $props();
</script>

<div
	role="group"
	aria-label={label}
	class="inline-flex flex-wrap gap-1 rounded-xl bg-stone-200/70 p-1 dark:bg-stone-800"
>
	{#each options as option (option.value)}
		<button
			type="button"
			aria-pressed={value === option.value}
			class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {value === option.value
				? 'bg-white text-stone-900 shadow-sm dark:bg-stone-600 dark:text-white'
				: 'text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white'}"
			onclick={() => (value = option.value)}
		>
			{option.label}
		</button>
	{/each}
</div>
