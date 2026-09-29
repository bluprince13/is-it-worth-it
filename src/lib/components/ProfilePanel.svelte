<script lang="ts">
	import type { Profile } from '$lib/finance/types';
	import { PROFILE_SECTIONS, TYPICAL_PROFILE, validateProfile, type FieldKind } from '$lib/profile';
	import NumberField from './NumberField.svelte';

	let { profile = $bindable(), open = $bindable() }: { profile: Profile; open: boolean } = $props();

	let dialog: HTMLDialogElement;

	const errors = $derived(validateProfile(profile));

	$effect(() => {
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});

	const FIELD_FORMAT: Record<FieldKind, { scale?: number; prefix?: string; suffix?: string }> = {
		money: { prefix: '£' },
		hours: { suffix: 'hours' },
		percent: { scale: 100, suffix: '%' }
	};
</script>

<dialog
	bind:this={dialog}
	onclose={() => (open = false)}
	onclick={(e) => e.target === dialog && dialog.close()}
	aria-labelledby="profile-title"
	class="m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-stone-50 p-0 text-stone-900 backdrop:bg-stone-950/40 backdrop:backdrop-blur-sm dark:bg-stone-950 dark:text-stone-100"
>
	<div class="flex h-full flex-col">
		<header
			class="flex items-center justify-between border-b border-stone-200 px-5 py-4 dark:border-stone-800"
		>
			<div>
				<h2 id="profile-title" class="text-lg font-semibold">Your profile</h2>
				<p class="text-xs text-stone-500 dark:text-stone-400">
					Saved in this browser only. Grey figures are placeholders, used until you enter your own.
				</p>
			</div>
			<button
				type="button"
				class="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800"
				onclick={() => dialog.close()}>Done</button
			>
		</header>

		<div class="flex-1 space-y-8 overflow-y-auto px-5 py-6">
			{#each PROFILE_SECTIONS as section (section.title)}
				<section>
					<h3
						class="mb-3 text-xs font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400"
					>
						{section.title}
					</h3>
					<div class="space-y-4">
						{#each section.fields as field (field.key)}
							<NumberField
								id="profile-{field.key}"
								label={field.label}
								hint={field.hint}
								{...FIELD_FORMAT[field.kind]}
								placeholder={TYPICAL_PROFILE[field.key]}
								error={errors[field.key]}
								bind:value={profile[field.key]}
							/>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	</div>
</dialog>
