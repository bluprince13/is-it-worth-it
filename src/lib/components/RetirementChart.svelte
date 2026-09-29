<script lang="ts">
	import { valueAt, type Point, type RetirementSeries } from '$lib/chart/retirementSeries';
	import { formatElapsed, formatMoney, formatMoneyCompact } from '$lib/format';
	import Segmented from './Segmented.svelte';

	let { series }: { series: RetirementSeries } = $props();

	const HEIGHT = 240;
	const MARGIN = { top: 12, right: 16, bottom: 28, left: 52 };
	const NEAR_WINDOW_MONTHS = 24;

	let view = $state<'near' | 'whole'>('near');
	let width = $state(600);
	let hoverMonth = $state<number | null>(null);

	const x0 = $derived(view === 'near' ? Math.max(0, series.fiWithout - NEAR_WINDOW_MONTHS) : 0);
	const x1 = $derived(series.end);

	const clipId = $props.id();

	const yDomain = $derived.by(() => {
		const targets = [...series.targetWithout, ...series.targetWith].map((p) => p.value);
		const top = Math.max(...targets);
		if (view === 'whole') return [Math.min(0, ...series.with.map((p) => p.value)), top * 1.05];
		const lows = [...series.with, ...series.without]
			.filter((p) => p.month >= x0)
			.map((p) => p.value);
		const bottom = Math.min(...lows);
		const pad = (top - bottom) * 0.08;
		return [bottom - pad, top + pad];
	});

	const innerWidth = $derived(Math.max(0, width - MARGIN.left - MARGIN.right));
	const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

	const x = (month: number) => MARGIN.left + ((month - x0) / (x1 - x0)) * innerWidth;
	const y = (value: number) =>
		MARGIN.top + innerHeight - ((value - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight;

	const path = (points: Point[]) =>
		points
			.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.month).toFixed(1)},${y(p.value).toFixed(1)}`)
			.join('');

	const yTicks = $derived.by(() => {
		const [lo, hi] = yDomain;
		const raw = (hi - lo) / 4;
		const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
		const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw)!;
		const ticks: number[] = [];
		for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) ticks.push(v);
		return ticks;
	});

	const xTicks = $derived.by(() => {
		const span = x1 - x0;
		const step = [3, 6, 12, 24, 60, 120].find((s) => span / s <= 6)!;
		const ticks: number[] = [];
		for (let m = Math.ceil(x0 / step) * step; m <= x1; m += step) ticks.push(m);
		return ticks;
	});

	const yearsLabel = (month: number) => {
		const years = month / 12;
		return Number.isInteger(years) ? `${years}y` : `${years.toFixed(1)}y`;
	};

	function onPointerMove(event: PointerEvent) {
		const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
		const month = x0 + ((event.clientX - rect.left - MARGIN.left) / innerWidth) * (x1 - x0);
		hoverMonth = Math.min(x1, Math.max(x0, Math.round(month)));
	}

	function netWorthAt(points: Point[], fi: number, month: number): number | null {
		if (month > fi) return null;
		return valueAt(
			points.map((p) => p.value),
			month
		);
	}

	const tooltip = $derived.by(() => {
		if (hoverMonth === null) return null;
		const m = hoverMonth;
		return {
			month: m,
			without: netWorthAt(series.without, series.fiWithout, m),
			with: netWorthAt(series.with, series.fiWith, m),
			targetWith: valueAt(
				series.targetWith.map((p) => p.value),
				m
			),
			targetWithout: valueAt(
				series.targetWithout.map((p) => p.value),
				m
			)
		};
	});

	const delayDays = $derived((series.fiWith - series.fiWithout) * (365.25 / 12));
	const description = $derived(
		`Net worth over time. Without the purchase it reaches the retirement target in ${(series.fiWithout / 12).toFixed(1)} years; with it, in ${(series.fiWith / 12).toFixed(1)} years.`
	);
</script>

<div class="mt-5">
	<div class="mb-3 flex flex-wrap items-center justify-between gap-3">
		<ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600 dark:text-stone-300">
			<li class="flex items-center gap-1.5">
				<span class="h-0.5 w-4 rounded bg-series-without"></span>Without it
			</li>
			<li class="flex items-center gap-1.5">
				<span class="h-0.5 w-4 rounded bg-series-with"></span>With it
			</li>
			{#if series.sameTarget}
				<li class="flex items-center gap-1.5">
					<span class="w-4 border-t-2 border-dashed border-stone-400"></span>Retirement target
				</li>
			{:else}
				<li class="flex items-center gap-1.5">
					<span class="w-4 border-t-2 border-dashed border-series-without"></span>Target without
				</li>
				<li class="flex items-center gap-1.5">
					<span class="w-4 border-t-2 border-dashed border-series-with"></span>Target with it
				</li>
			{/if}
		</ul>
		<Segmented
			label="Chart range"
			options={[
				{ value: 'near', label: 'Near retirement' },
				{ value: 'whole', label: 'Whole path' }
			]}
			bind:value={view}
		/>
	</div>

	<div class="relative" bind:clientWidth={width}>
		<svg
			{width}
			height={HEIGHT}
			role="img"
			aria-label={description}
			class="block touch-none overflow-visible select-none"
			onpointermove={onPointerMove}
			onpointerleave={() => (hoverMonth = null)}
		>
			{#each yTicks as tick (tick)}
				<line
					x1={MARGIN.left}
					x2={width - MARGIN.right}
					y1={y(tick)}
					y2={y(tick)}
					class="stroke-stone-200 dark:stroke-stone-800"
				/>
				<text
					x={MARGIN.left - 8}
					y={y(tick)}
					dy="0.32em"
					text-anchor="end"
					class="fill-stone-500 text-[11px] tabular-nums dark:fill-stone-400"
					>{formatMoneyCompact(tick)}</text
				>
			{/each}
			{#each xTicks as tick (tick)}
				<text
					x={x(tick)}
					y={HEIGHT - 8}
					text-anchor="middle"
					class="fill-stone-500 text-[11px] tabular-nums dark:fill-stone-400"
					>{yearsLabel(tick)}</text
				>
			{/each}

			<defs>
				<clipPath id={clipId}>
					<rect x={MARGIN.left} y={0} width={innerWidth} height={HEIGHT} />
				</clipPath>
			</defs>

			<g clip-path="url(#{clipId})">
				<rect
					x={x(series.fiWithout)}
					y={MARGIN.top}
					width={Math.max(1, x(series.fiWith) - x(series.fiWithout))}
					height={innerHeight}
					class="fill-series-with opacity-10"
				/>

				{#if series.sameTarget}
					<path
						d={path(series.targetWith)}
						fill="none"
						stroke-width="1.5"
						stroke-dasharray="4 4"
						class="stroke-stone-400"
					/>
				{:else}
					<path
						d={path(series.targetWithout)}
						fill="none"
						stroke-width="1.5"
						stroke-dasharray="4 4"
						class="stroke-series-without opacity-70"
					/>
					<path
						d={path(series.targetWith)}
						fill="none"
						stroke-width="1.5"
						stroke-dasharray="4 4"
						class="stroke-series-with opacity-70"
					/>
				{/if}

				<path
					d={path(series.without)}
					fill="none"
					stroke-width="2"
					stroke-linejoin="round"
					class="stroke-series-without"
				/>
				<path
					d={path(series.with)}
					fill="none"
					stroke-width="2"
					stroke-linejoin="round"
					class="stroke-series-with"
				/>

				{#each [{ fi: series.fiWithout, points: series.without, cls: 'fill-series-without' }, { fi: series.fiWith, points: series.with, cls: 'fill-series-with' }] as marker (marker.cls)}
					<circle
						cx={x(marker.fi)}
						cy={y(marker.points.at(-1)!.value)}
						r="4.5"
						stroke-width="2"
						class="{marker.cls} stroke-white dark:stroke-stone-900"
					/>
				{/each}
			</g>

			{#if tooltip}
				<line
					x1={x(tooltip.month)}
					x2={x(tooltip.month)}
					y1={MARGIN.top}
					y2={MARGIN.top + innerHeight}
					class="stroke-stone-400 dark:stroke-stone-500"
				/>
			{/if}

			<rect
				x={MARGIN.left}
				y={MARGIN.top}
				width={innerWidth}
				height={innerHeight}
				fill="transparent"
			/>
		</svg>

		{#if tooltip}
			<div
				class="pointer-events-none absolute top-2 z-10 min-w-40 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-stone-700 dark:bg-stone-800"
				style:left="{Math.min(x(tooltip.month) + 12, width - 180)}px"
			>
				<p class="mb-1 font-medium text-stone-500 dark:text-stone-400">
					In {yearsLabel(tooltip.month).replace('y', ' years')}
				</p>
				<dl class="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-0.5">
					{#each [{ label: 'With it', value: tooltip.with, cls: 'bg-series-with' }, { label: 'Without it', value: tooltip.without, cls: 'bg-series-without' }] as row (row.label)}
						<dt class="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
							<span class="h-0.5 w-3 rounded {row.cls}"></span>{row.label}
						</dt>
						<dd class="text-right font-semibold text-stone-900 tabular-nums dark:text-white">
							{row.value === null ? 'Target reached' : formatMoney(row.value)}
						</dd>
					{/each}
					{#if series.sameTarget}
						<dt class="text-stone-500 dark:text-stone-400">Target</dt>
						<dd class="text-right text-stone-700 tabular-nums dark:text-stone-300">
							{formatMoney(tooltip.targetWith)}
						</dd>
					{:else}
						<dt class="text-stone-500 dark:text-stone-400">Target with it</dt>
						<dd class="text-right text-stone-700 tabular-nums dark:text-stone-300">
							{formatMoney(tooltip.targetWith)}
						</dd>
						<dt class="text-stone-500 dark:text-stone-400">Target without</dt>
						<dd class="text-right text-stone-700 tabular-nums dark:text-stone-300">
							{formatMoney(tooltip.targetWithout)}
						</dd>
					{/if}
				</dl>
			</div>
		{/if}
	</div>
	<p class="mt-2 text-xs text-stone-500 dark:text-stone-400">
		The shaded strip is the {formatElapsed(delayDays)} between the two dates the target is reached.
	</p>
</div>
