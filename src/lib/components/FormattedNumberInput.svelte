<script lang="ts">
	import { groupNumberString, parseNumberString } from '$lib/format';

	interface Props {
		value?: number;
		id?: string;
		placeholder?: string;
		inputmode?: 'decimal' | 'numeric';
		class?: string;
		'aria-label'?: string;
		'aria-invalid'?: boolean;
		'aria-describedby'?: string;
	}

	let {
		value = $bindable(),
		id,
		placeholder,
		inputmode = 'decimal',
		class: className = '',
		'aria-label': ariaLabel,
		'aria-invalid': ariaInvalid,
		'aria-describedby': ariaDescribedby
	}: Props = $props();

	let inputEl: HTMLInputElement;

	const format = (v: number | undefined) => (v === undefined ? '' : groupNumberString(String(v)));

	function handleInput(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const raw = el.value;
		const caret = el.selectionStart ?? raw.length;
		const digitsBefore = raw.slice(0, caret).replace(/\D/g, '').length;
		el.value = groupNumberString(raw);
		let i = 0;
		let d = 0;
		while (i < el.value.length && d < digitsBefore) {
			if (/\d/.test(el.value[i])) d++;
			i++;
		}
		el.setSelectionRange(i, i);
		value = parseNumberString(raw);
	}

	$effect(() => {
		const el = inputEl;
		if (!el) return;
		const target = value;
		const current = parseNumberString(el.value);
		if (current === target) return;
		if (current !== undefined && target !== undefined && Math.abs(current - target) < 1e-9) {
			return;
		}
		el.value = format(target);
	});
</script>

<input
	bind:this={inputEl}
	{id}
	type="text"
	{inputmode}
	{placeholder}
	aria-label={ariaLabel}
	aria-invalid={ariaInvalid}
	aria-describedby={ariaDescribedby}
	class={className}
	oninput={handleInput}
/>
