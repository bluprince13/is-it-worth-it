# Is it worth it? — plan

Goal: take one expense (one-off or recurring) and show, through several lenses, how significant it is **to you**.

---

## 1. Research summary

| Idea                                                                                                                                               | Source                                                                                                                                                                                                                                    | What it gives us                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Money as "life energy"** — price ÷ _real_ hourly wage (net pay minus work costs, divided by all work-related hours incl. commute)                | _Your Money or Your Life_ (Robin & Dominguez); many "true cost" calculators ([truecost.me](https://truecost.me/), [pricetohours.com](https://pricetohours.com/), [Millennial Money](https://millennialmoney.com/true-cost-anything/))     | Hours-of-work lens, and the refinement that "real" wage is lower than salary ÷ contract hours |
| **0.01% rule** — you can spend 1/10,000 of net worth per day without it mattering (≈ 3.7%/yr); applies to occasional splurges, not recurring spend | Nick Maggiulli, _The Wealth Ladder_ ([Morningstar](https://www.morningstar.com/personal-finance/how-one-rule-can-simplify-your-spending-decisions), [Money with Katie](https://moneywithkatie.com/the_mwk_show/wealth-ladder/))           | Net-worth-relative lens with a ready-made "doesn't matter" threshold                          |
| **0.1% rule** — purchases under 0.1% of net worth don't need discussion                                                                            | [marginofsaving (Medium)](https://medium.com/@marginofsaving/the-0-1-rule-why-we-no-longer-fight-about-money-a33f76c8ad7e)                                                                                                                | Second threshold for the same lens                                                            |
| **Net-worth rules for big items** — car ≤ 5% of net worth or 10% of income                                                                         | [Financial Samurai](https://www.financialsamurai.com/net-worth-rule-for-car-buying-guideline/), [Bogleheads](https://www.bogleheads.org/forum/viewtopic.php?t=351985)                                                                     | Thresholds for the "major purchase" end of the scale                                          |
| **Latte factor / opportunity cost** — the real cost is the forgone compounding                                                                     | [Financial Mentor latte calculator](https://www.financialmentor.com/calculator/latte-factor-calculator)                                                                                                                                   | Future-value lens                                                                             |
| **FIRE maths** — FI number = annual spend ÷ SWR (4% → ×25); spending changes delay FI                                                              | FIRE calculators ([Engaging Data](https://engaging-data.com/fire-calculator/), [WalletBurst](https://walletburst.com/tools/fire-calculator/))                                                                                             | Retirement-delay and "capital needed to fund this forever" lenses                             |
| **Buying time promotes happiness**; experiences beat things                                                                                        | Whillans, Dunn, Norton et al., [PNAS 2017](https://www.pnas.org/doi/10.1073/pnas.1706541114); _Happy Money_ ([Kitces](https://www.kitces.com/blog/happy-money-and-the-science-of-spending-how-money-really-can-sometimes-buy-happiness/)) | Value-side lenses: cost per hour saved / per use                                              |
| **Memory dividends, net fulfilment over net worth**                                                                                                | Bill Perkins, [_Die With Zero_](https://diewithzerobook.com/)                                                                                                                                                                             | Counterweight: the app must not only say "don't spend"                                        |

Takeaway: existing tools each do **one** lens (hours of work, or latte factor, or FIRE). Nobody puts them side by side, and almost none handle one-off vs recurring properly. That's the gap.

---

## 2. The lenses

Notation: `X` = amount per payment; `c` = cost per year for recurring; `T` = how long it recurs. `r` = expected **real** return (default 5%). `SWR` = safe withdrawal rate (default 4%). All amounts in £, and tax is ignored throughout (take-home pay in, spending out).

### Recurring costs: frequency and duration

Every lens that handles recurring costs uses the same two inputs:

- **Frequency**: daily, weekly, monthly, quarterly or yearly, or a custom "every N days/weeks/months". Normalised to `c = X × payments per year`.
- **Duration (`T`)**: a number of years or months, **until I retire (FI)**, or **lifelong**.

Duration decides how hard a recurring cost hits retirement:

- **Ends before FI**: it only reduces savings while you pay it.
- **Lifelong**: it reduces savings _and_ adds `c ÷ SWR` to the FI number, because retirement has to fund it too. This is the double hit.
- **Ends after FI but not lifelong** (e.g. 20 years): it reduces savings until FI, and the FI number rises by the present value at FI of the payments still to come (discounted at `SWR ÷ 12` per month, so it converges smoothly to `c ÷ SWR` as the duration grows), not the full `c ÷ SWR`.

### A. Time — "what did I trade for it?"

1. **Hours of work** — `X ÷ take-home hourly wage`. Also shown as days/weeks of work. Recurring: hours per month and per year, and in total over `T`.

### B. Wealth — "does it dent me?"

2. **% of net worth**, placed against the thresholds: 0.01% (daily noise), 0.1% (no discussion needed), 1%, 5% (car-rule territory).
3. **Portfolio earn-back time** — how long your investments take to earn `X`: `X ÷ (NW × r)` years → shown in days/hours. "Your portfolio earns this back in 3 days."
4. **Total earn-back time** — the same, but counting savings plus returns: `X ÷ (annual savings + NW × r)`.

### C. Future — "what does it cost future me?"

5. **Retirement delay** (headline lens) — simulate net worth month by month to the FI number (`annual spend ÷ SWR`, where annual spend = take-home pay − savings), with and without the purchase, and report the difference in days/weeks/months.
   - One-off: lowers today's net worth.
   - Recurring: applies the frequency and duration rules above, so a lifelong subscription shows the double hit.
   - Already FI: nothing to delay, so show the drop in safe annual spending instead (`lost capital × SWR`).
6. **Future value** — what the money would be worth at your FI date if invested instead: `X(1+r)^n`. Recurring: future value of the payments made before FI (the latte factor).
7. **Capital needed to fund it** (recurring only) — `c ÷ SWR` if lifelong, otherwise the present value of the remaining payments. "£15/month Netflix for life needs £4,500 invested to pay for it forever."

### D. Budget — "how does it fit my spending?"

8. **Days of living costs** — `X ÷ (annual spend ÷ 365)`, with annual spend = take-home pay − savings.
9. **Reframed totals** (recurring) — per day, per year, and in total over the chosen duration. Show both directions honestly: per-day makes it feel small, lifetime makes it feel big.

### E. Value — "what do I get for it?" (needs a little input about the purchase)

10. **Cost per use / per hour of enjoyment** — `X ÷ expected uses` (or hours). Compare with anchors (e.g. cinema ≈ £5/hour, streaming ≈ £0.20/hour).
11. **Price of time bought** — for time-saving purchases (cleaner, taxi, dishwasher): `X ÷ hours saved`, compared with your hourly wage. If it's cheaper than your wage, the research says it's likely a good buy.

### F. Tangible anchors (fun, low priority)

12. **"That's the same as…"** — user-defined anchors (a month of groceries, a weekend away, council tax).

Not doing (at least in v1): extra profile inputs that aren't essential to the maths (commute, work costs, fun budget, age, separate spending figure), income tax (everything uses take-home pay), tax on investment returns (assume ISA/pension wrapper), a fixed-retirement-age mode, inflation-adjusted salary growth, Monte Carlo returns.

---

## 3. App design

### Principles

- **Private by default.** Financial profile stays in `localStorage`; nothing is sent anywhere. Share links carry the purchase only, never the profile.
- **Progressive disclosure.** Amount + take-home pay is enough to start. Each extra profile field unlocks more lenses ("Add net worth to unlock 3 more views").
- **Neutral, not preachy.** Every lens gets the same visual weight. The app shows scale, not a verdict. It includes the value lenses (E) so it isn't only an argument for not spending.
- **Show the working.** Each result expands to show the formula and inputs used.

### Screens / layout (single page)

```
┌──────────────────────────────────────────────┐
│  £ [ 15 ]  ( One-off | Recurring )            │  ← hero input
│  every [ 1 ] [ month ▾ ]                      │  ← if recurring
│  for ( [ 3 ] years | until FI | lifelong )    │
│  for [ Netflix            ]  [ ⚙ Profile ]    │
├──────────────────────────────────────────────┤
│  Summary: "About 1 hour of work a month.      │
│  Delays retirement by ~5 weeks (lifelong)."   │
├──────────────────────────────────────────────┤
│  TIME       │  WEALTH       │  FUTURE        │  ← grouped cards
│  58 hours   │  0.3% of NW   │  +9 days to FI │
│  of work    │  earned back  │  £4,100 at 60  │
│  ▸ how      │  in 11 days   │  ▸ chart       │
├──────────────────────────────────────────────┤
│  BUDGET     │  VALUE (optional inputs)       │
└──────────────────────────────────────────────┘
```

- **Hero input**: amount, one-off / recurring toggle, optional label. Recurring reveals:
  - **Frequency**: preset chips (daily, weekly, monthly, quarterly, yearly) plus "every N [days/weeks/months/years]".
  - **Duration**: segmented control with a number of years or months, "until I retire", or "lifelong". Default: lifelong, since subscriptions tend to stick.
  - A live line under the inputs: "= £180/year, £2,700 until FI, lifelong".
- **Summary strip**: the 3 most telling lenses in one sentence, always including the retirement delay when the profile allows it. No overall score.
- **Lens cards**: headline number, one-line sentence, a severity chip (trivial / noticeable / significant / major) for that lens only, and an expandable "how it's calculated". The retirement delay card is first and largest, with a chart of net worth with vs without the purchase and the FI line. For a lifelong cost the chart shows the FI line moving up as well as the path moving down.
- **Profile drawer**: only the inputs the maths needs: take-home pay per year, hours worked per week, savings per year, net worth, plus two assumptions (real return, SWR) with defaults. Spending is derived as take-home − savings. £ throughout; no tax inputs.
- **Compare mode** (v2): two or three purchases side by side, e.g. "gym £40/month vs home rower £900".
- **Presets** (nice to have): coffee, Netflix, holiday, car, extension — useful for exploring and for the demo.

### Severity chips

Each card gets its own 0–3 level from thresholds (no combined score), e.g.

| Lens             | trivial | noticeable | significant | major             |
| ---------------- | ------- | ---------- | ----------- | ----------------- |
| Hours of work    | < 1 h   | < 1 day    | < 1 week    | ≥ 1 week          |
| % net worth      | < 0.01% | < 0.1%     | < 1%        | ≥ 1% (5% flagged) |
| Retirement delay | < 1 day | < 1 week   | < 1 month   | ≥ 1 month         |

Thresholds live in one config file so they're easy to tune.

---

## 4. Technical plan

- **Stack**: SvelteKit + `adapter-static` (Svelte 5 runes, TypeScript), Vite, Vitest. Tailwind CSS v4 (light/dark via `dark:` variants). Charts: hand-rolled SVG or LayerCake — only two small charts needed. Deploy to GitHub Pages / Netlify / Vercel.
- **Core idea: lenses are pure functions in a registry**, independent of the UI:

```ts
type Unit = 'day' | 'week' | 'month' | 'year';
type Recurrence = { every: number; unit: Unit }; // e.g. { every: 1, unit: 'month' }
type Duration = { kind: 'fixed'; months: number } | { kind: 'untilFI' } | { kind: 'lifelong' };
interface Purchase {
	amount: number;
	recurrence?: Recurrence;
	duration?: Duration;
	label?: string;
	uses?: number;
	hoursSaved?: number;
}
interface Profile {
	takeHomePerYear?: number;
	hoursPerWeek?: number;
	netWorth?: number;
	annualSavings?: number;
	realReturn: number;
	swr: number;
}

interface Lens {
	id: string;
	group: 'time' | 'wealth' | 'future' | 'budget' | 'value';
	requires: (keyof Profile | keyof Purchase)[];
	appliesTo: 'once' | 'recurring' | 'both';
	compute(p: Profile, x: Purchase): LensResult | null;
}
interface LensResult {
	value: number;
	unit: string;
	headline: string;
	sentence: string;
	severity: 0 | 1 | 2 | 3;
	working: string;
	series?: Point[];
}
```

- **Layout**
  ```
  src/lib/finance/     # pure maths: fv, annuity, simulateToFI, hourlyRate
  src/lib/lenses/      # one file per lens + index.ts registry + thresholds.ts
  src/lib/stores/      # profile (persisted), purchase (URL-synced)
  src/lib/components/  # AmountInput, FrequencyToggle, LensCard, SummaryStrip, ProfileDrawer, charts
  src/routes/+page.svelte
  ```
- **Retirement simulation**: monthly steps, `NW ← NW × (1+r)^(1/12) + monthlySavings − purchasePaymentsThisMonth`; FI when `NW ≥ target`. Baseline target = `annualSpend ÷ SWR`. With the purchase, target += `c ÷ SWR` if lifelong, or the present value at the FI month of payments still due if it's a fixed duration that outlasts FI; "until FI" adds nothing. Because the target depends on the FI month, iterate by checking each month's `NW` against that month's target. Cap at 80 years and report "not reachable" rather than looping. The crossing is interpolated within the month, so a £4 coffee still shows a delay in hours or days rather than rounding to zero.
- **Recurrence helpers**: `paymentsPerYear`, `annualCost`, `monthlyCost` (every frequency is averaged into a monthly cost, so the simulation stays monthly), `remainingMonths(duration, elapsed, fiMonth)`, `totalCost`.
- **Tests**: unit tests for every lens and finance helper (known-answer cases, edge cases: zero net worth, already FI, no salary, 0% return, a fixed duration that ends exactly at FI, lifelong vs until-FI).
- **URL state**: `?amt=15&every=1m&for=life&label=Netflix` so a purchase can be shared or bookmarked.

### Milestones

1. ✅ Scaffold SvelteKit + Tailwind + finance and recurrence helpers + tests.
2. ✅ Purchase input (frequency and duration), lenses A–D with the card UI, profile drawer (localStorage).
3. Retirement-delay card and chart, summary strip, severity chips.
4. Value lenses (E), presets, URL sharing.
5. Compare mode, tangible anchors, polish (dark mode, mobile, a11y).

---

## 5. Decisions

- Currency: £ only. No income tax modelling.
- Retirement: always shown as delay to FI (no fixed-retirement-age mode).
- No overall significance score; severity is per lens only.
- Styling: Tailwind.
