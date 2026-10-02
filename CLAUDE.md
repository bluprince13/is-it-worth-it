# Is it worth it?

A single-page app that shows what one purchase (one-off or recurring) costs a person based on their income, wealth and retirement target. UK-focused, £ only. Unreleased. [PLAN.md](PLAN.md) has the research, design and decision history.

## Commands

```bash
npm run dev      # dev server (also in .claude/launch.json as "dev", port 5173, served under /apps/is-it-worth-it)
npm test         # vitest, run once
npm run check    # svelte-check / TypeScript
npm run lint     # prettier --check
npm run build    # static site into build/
```

Run `npx prettier --write .`, then `npm test`, `npm run check` and `npm run build` before committing.

## Stack

SvelteKit with `adapter-static` (prerendered, no server), Svelte 5 runes, TypeScript, Tailwind v4 with `@tailwindcss/forms`, Vitest. Charts are hand-written SVG.

## Layout

- `src/lib/finance/`: pure maths. `fi.ts` simulates net worth month by month until it reaches the retirement target, with and without the purchase. `recurrence.ts` normalises frequencies. `growth.ts` does compounding. `wage.ts` gives the hourly wage.
- `src/lib/lenses/`: each card ("lens") is a pure function in a registry (`index.ts`). A lens declares every profile field it reads in `requires`. `evaluate()` returns `results` plus `blocked` lenses whose fields are missing or invalid.
- `src/lib/profile.ts`: profile fields, typical-UK placeholders, validation, localStorage.
- `src/lib/draft.ts`: purchase form state, examples and validation.
- `src/lib/share.ts`: encodes and decodes share-link query params.
- `src/lib/chart/` and `src/lib/components/`: UI. `src/routes/+page.svelte` wires it together.

## Model

- **Profile:** take-home pay, hours per week, savings per year (including pension contributions, so they may exceed take-home pay), net worth (investable, including pensions), retirement target, and investment return (real, above inflation).
- **One-off purchases** can't exceed net worth; the amount shows an error instead of results.
- **No other inputs:** no tax, withdrawal rate, spending figure or age. Keep inputs to what the maths needs.
- **Retirement target:** used exactly as entered. It is never derived or adjusted by a purchase.
- **Retirement delay:** savings are added to net worth each month and grow at the return. A one-off comes out of today's net worth. A recurring cost comes out of monthly savings until the target is reached, or until a fixed duration ends. The crossing month is interpolated, so small purchases show hours or days.
- **Recurring duration:** "For N years/months" or "Until I retire" (the default).
- **Invested instead:** compounds either until retirement or for N years, chosen on the card.
- **Placeholders:** an empty profile field uses the typical-UK figure in `TYPICAL_PROFILE`, shown as grey placeholder text and noted on the page.
- **Invalid fields:** never replaced by a placeholder. Every card that uses the field shows an error with a link to the profile.

## Rules

- **Factual copy only, never financial advice.**
  - Text states calculations and names its assumptions ("on these figures", "assumed 5% return").
  - No judgements ("small enough not to worry"), no severity or significance labels, nothing about what the user can or should do.
  - No modelled outcome stated as a fact about the user's life. Write "net worth reaches the retirement target in 21 years", not "you'll be financially independent".
  - Published rules of thumb (e.g. the 0.01% rule) may be cited only as attributed reference points behind a card's ⓘ button, with a link to the source, never as a verdict.
  - Keep the "not financial advice" footer.
  - Check new copy for words like should, can, safe, worth, good, really, afford.
- **"How it's calculated" shows equations** that reproduce the headline figure, not prose.
- **No backwards compatibility.** When an option, field or URL param is removed or renamed, delete it outright, with no fallback parsing or migration.
- **Share links carry everything entered:** the purchase, the profile figures the user typed, and the Invested instead horizon. They never carry placeholders. Opening a link shows its figures without overwriting the viewer's saved profile until they choose "Keep these".
- **Profile stays in the browser** (localStorage). Nothing is sent to a server.
- **Every lens and helper has unit tests.** UI changes are checked in the browser pane at desktop and phone widths, in light and dark mode.
- **Comments:** minimal, only for why something non-obvious is done.
