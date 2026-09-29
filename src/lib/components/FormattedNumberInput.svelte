<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { groupNumberString, parseNumberString, reformatNumberInput } from '$lib/format';

	interface Props extends Omit<HTMLInputAttributes, 'value' | 'type' | 'oninput'> {
		value?: number;
	}

	let { value = $bindable(), inputmode = 'decimal', ...rest }: Props = $props();

	let inputEl: HTMLInputElement;

	function handleInput(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const next = reformatNumberInput(el.value, el.selectionStart ?? el.value.length);
		el.value = next.text;
		el.setSelectionRange(next.caret, next.caret);
		value = next.value;
	}

	$effect(() => {
		const target = value;
		const current = parseNumberString(inputEl.value);
		if (current === target) return;
		if (current !== undefined && target !== undefined && Math.abs(current - target) < 1e-9) {
			return;
		}
		inputEl.value = target === undefined ? '' : groupNumberString(String(target));
	});
</script>

<input bind:this={inputEl} {...rest} type="text" {inputmode} oninput={handleInput} />
