<script lang="ts">
	let {
		label,
		controls,
		expanded = $bindable()
	}: { label: string; controls: string; expanded: boolean } = $props();
</script>

<button
	type="button"
	aria-label={label}
	aria-expanded={expanded}
	aria-controls={controls}
	class="-m-1 flex size-7 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
	onclick={() => (expanded = !expanded)}
>
	<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-4">
		<path
			fill-rule="evenodd"
			d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
			clip-rule="evenodd"
		/>
	</svg>
</button>
