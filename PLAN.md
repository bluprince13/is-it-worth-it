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
| **Buying time promotes happiness**; experiences beat things                                                                                        | Whillans, Dunn, Norton et al., [PNAS 2017](https://www.pnas.org/doi/10.1073/pnas.1706541114); _Happy Money_ ([Kitces](https://www.kitces.com/blog/happy-money-and-the-science-of-spending-how-money-really-can-sometimes-buy-happiness/)) | Value-side lenses (dropped to keep inputs minimal)                                            |     |
| **Memory dividends, net fulfilment over net worth**                                                                                                | Bill Perkins, [_Die With Zero_](https://diewithzerobook.com/)                                                                                                                                                                             | Counterweight: the app must not only say "don't spend"                                        |

Takeaway: existing tools each do **one** lens (hours of work, or latte factor, or FIRE). Nobody puts them side by side, and almost none handle one-off vs recurring properly. That's the gap.

---

## 2. The lenses

Notation: `X` = amount per payment; `c` = cost per year for recurring; `T` = how long it recurs. `r` = expected **real** return (default 5%). All amounts in £, and tax is ignored throughout (salary before tax in, spending out).

### Recurring costs: frequency and duration

Every lens that handles recurring costs uses the same two inputs:

- **Frequency**: daily, weekly, monthly, quarterly or yearly, or a custom "every N days/weeks/months". Normalised to `c = X × payments per year`.
- **Duration (`T`)**: a number of years or months, or **until I retire** (the default).

Duration only matters while payments come out of savings before the retirement target is reached: the target itself is the user's own figure and never changes. A fixed period differs from "until I retire" only if it ends before the target date. In "Invested instead" over N years, "until I retire" payments stop at the target date and the total keeps compounding to year N. (A separate "lifelong" option was removed: with a fixed target it gave the same retirement delay.)

### A. Income — "what did I trade for it?"

1. **Hours of work** — `X ÷ before-tax hourly wage` (salary ÷ hours actually worked). Also shown as days/weeks of work. Recurring: headline is hours of work per year, with hours per payment alongside.

### B. Wealth — "does it dent me?"

2. **% of net worth**, placed against the thresholds: 0.01% (daily noise), 0.1% (no discussion needed), 1%, 5% (car-rule territory).
3. **Wealth earn-back time** — how long your investment returns alone take to earn it back: `X ÷ (NW × r)` years, shown as hours/days/weeks. Savings are excluded here (they are already what the retirement-delay lens models). Recurring: the time each year to earn back a year's cost, with the share of yearly wealth growth alongside.

### C. Future — "what does it cost future me?"

4. **Retirement delay** (headline lens) — simulate net worth month by month to the user's **retirement target** (a profile input, in today's money), with and without the purchase, and report the difference in days/weeks/months.
   - One-off: lowers today's net worth.
   - Recurring: payments come out of savings each month until the target is reached (or a fixed duration ends).
   - Already at or above the target: the card shows N/A ("net worth already meets the retirement target").
5. **Invested instead** — what the money would be worth if invested at `r`, over a horizon chosen on the card: "Until retirement" (the target date, default) or "For N years". One-off: `X(1+r)^n`. Recurring: payments made within the horizon, each compounded to its end (payments that stop early keep growing). "How it's calculated" shows the equations: monthly return, the annuity formula, and any further growth.

Not doing (at least in v1): a summary sentence above the cards (it repeated the cards without adding anything), a withdrawal rate or "capital to fund it" card (the target is used as entered), side-by-side comparison of purchases, budget lenses (days of living costs, reframed totals: judged not useful), severity labels on cards (the thresholds behind "significant" or "major" weren't meaningful to readers), value lenses that need extra inputs per purchase (cost per use, price of time bought, "that's the same as…" anchors), extra profile inputs that aren't essential to the maths (commute, work costs, fun budget, age, separate spending figure), income tax (the hourly rate is before tax), tax on investment returns (assume ISA/pension wrapper), a fixed-retirement-age mode, inflation-adjusted salary growth, Monte Carlo returns.

---

## 3. App design

### Principles

- **Private by default.** Financial profile stays in `localStorage`; nothing is sent to a server. A share link carries everything entered, purchase and profile, and says so when copied. Opening a link shows its figures without overwriting the viewer's own saved profile unless they choose to keep them.
- **Works with no setup.** Any empty profile field falls back to a typical UK full-time employee (£39,039 salary, the ONS April 2025 median; 37.5 hours; £5,600 saved, i.e. £3,000 from take-home pay plus 5% employee and 3% employer auto-enrolment pension contributions; £20,000 invested; £675,000 retirement target, i.e. 25 × the £27,000 spent from about £30,000 take-home), so every lens shows straight away. Defaults are shown as grey placeholders, never saved as the user's own, and a note above the cards names the fields still on defaults.
- **Factual, never advice.** Every lens gets the same visual weight. Text states calculations and names assumptions ("on these figures", "assumed 5% return"); it never judges a purchase (no "small enough not to worry"), never says what the user can or should do, and never states a modelled outcome as a fact about their life ("reaches the retirement target in 21 years", not "you'll be financially independent"). A footer says it's for illustration only and not financial advice.
- **Show the working.** Each result expands to show the formula and inputs used.

### Screens / layout (single page)

```
┌──────────────────────────────────────────────┐
│  £ [ 15 ]  ( One-off | Recurring )            │  ← hero input
│  every [ 1 ] [ month ▾ ]                      │  ← if recurring
│  for ( [ 3 ] years | until I retire )         │
│  for [ Netflix            ]  [ ⚙ Profile ]    │
├──────────────────────────────────────────────┤
│  INCOME     │  WEALTH       │  FUTURE        │  ← grouped cards
│  58 hours   │  0.3% of NW   │  +9 days to FI │
│  of work    │  earned back  │  £4,100 at 60  │
│  ▸ how      │  in 11 days   │  ▸ chart       │
└──────────────────────────────────────────────┘
```

- **Hero input**: amount, one-off / recurring toggle, optional label. Recurring reveals:
  - **Frequency**: preset chips (daily, weekly, monthly, quarterly, yearly) plus "every N [days/weeks/months/years]".
  - **Duration**: segmented control with a number of years or months, or "until I retire" (default).
  - A live line under the inputs: "= £180 a year, until you retire".
- **Lens cards**: headline number, one-line sentence, and an expandable "how it's calculated". The retirement delay card is first and largest, with a chart of net worth with vs without the purchase and the FI line.
- **Profile drawer**: only the inputs the maths needs: salary per year (before tax), hours worked per week, savings per year, net worth, retirement target, plus one assumption (real return) with a default. No withdrawal rate: the target is used as entered. £ throughout; no tax inputs.
- **Reset**: a Reset button in the profile panel footer clears every entered figure (placeholders apply again; return goes back to 5%). It asks for confirmation inline and is disabled when there's nothing to clear.
- **Validation**: salary > £0; retirement target > £0; hours per week > 0 and ≤ 100; savings ≥ £0 and < salary (or the placeholder salary if empty); savings include pension contributions from the user and their employer; net worth ≥ £0, including pensions; investment return 0–100%; amount > £0, and a one-off amount ≤ net worth (no cards are shown while it's over); "every N" and "for N" whole numbers ≥ 1. Invalid figures show an inline error and are saved as typed. They are never replaced by a placeholder: every card that uses one shows "Can't be calculated because your … isn't valid" with a link to the profile. Each lens declares every profile field it reads (including the return) so this is exact.
- **Share feedback**: a small popover under the header buttons says "Link copied" (and that the link includes profile figures), fading after 4 seconds; the button itself never changes. If the clipboard is blocked, the popover shows the link to copy by hand, with a close button.
- **Presets** (nice to have): coffee, Netflix, holiday, car, extension — useful for exploring and for the demo.

---

## 4. Technical plan

- **Stack**: SvelteKit + `adapter-static` (Svelte 5 runes, TypeScript), Vite, Vitest. Tailwind CSS v4 (light/dark via `dark:` variants). Charts: hand-rolled SVG or LayerCake — only two small charts needed. Deploy to GitHub Pages / Netlify / Vercel.
- **Core idea: lenses are pure functions in a registry**, independent of the UI:

```ts
type Unit = 'day' | 'week' | 'month' | 'year';
type Recurrence = { every: number; unit: Unit }; // e.g. { every: 1, unit: 'month' }
type Duration = { kind: 'fixed'; months: number } | { kind: 'untilFI' };
interface Purchase {
	amount: number;
	recurrence?: Recurrence;
	duration?: Duration;
	label?: string;
}
interface Profile {
	salaryPerYear?: number;
	hoursPerWeek?: number;
	netWorth?: number;
	annualSavings?: number;
	retirementTarget?: number;
	realReturn: number;
}

interface Lens {
	id: string;
	group: 'income' | 'wealth' | 'future';
	requires: (keyof Profile | keyof Purchase)[];
	appliesTo: 'once' | 'recurring' | 'both';
	compute(p: Profile, x: Purchase): LensResult | null;
}
interface LensResult {
	value: number;
	unit: string;
	headline: string;
	sentence: string;
	working: string;
	series?: Point[];
}
```

- **Layout**
  ```
  src/lib/finance/     # pure maths: fv, annuity, simulateToFI, hourlyRate
  src/lib/lenses/      # one file per group + index.ts registry
  src/lib/stores/      # profile (persisted), purchase (URL-synced)
  src/lib/components/  # AmountInput, FrequencyToggle, LensCard, ProfileDrawer, charts
  src/routes/+page.svelte
  ```
- **Retirement simulation**: monthly steps, `NW ← NW × (1+r)^(1/12) + monthlySavings − purchasePaymentsThisMonth`; FI when `NW ≥ target`. Baseline target = the profile's retirement target. The target is fixed; a recurring cost only reduces monthly savings while it's being paid. Cap at 80 years and report "not reachable" rather than looping. The crossing is interpolated within the month, so a £4 coffee still shows a delay in hours or days rather than rounding to zero.
- **Recurrence helpers**: `paymentsPerYear`, `annualCost`, `monthlyCost` (every frequency is averaged into a monthly cost, so the simulation stays monthly), `remainingMonths(duration, elapsed, fiMonth)`.
- **Tests**: unit tests for every lens and finance helper (known-answer cases, edge cases: zero net worth, already FI, no salary, 0% return, a fixed duration that ends exactly at FI).
- **Share links**: `?amt=15&for=Netflix&every=1m&dur=fi&sal=42000&hrs=40&sav=12000&nw=100000&tgt=750000&ret=5&inv=10` (return as a percentage; `inv` only when "Invested instead" is set to N years). Read on load, then removed from the address bar so later edits and refreshes aren't confused with the link.

### Milestones

1. ✅ Scaffold SvelteKit + Tailwind + finance and recurrence helpers + tests.
2. ✅ Purchase input (frequency and duration), lenses A–D with the card UI, profile drawer (localStorage).
3. ✅ Retirement-delay chart (near-retirement and whole-path views).
4. ✅ Example presets, share links carrying purchase and profile.
5. Polish (a11y, empty states).

---

## 5. Decisions

- Currency: £ only. No income tax modelling.
- Retirement: always shown as delay to FI (no fixed-retirement-age mode).
- No significance scores or severity labels.
- Styling: Tailwind.
