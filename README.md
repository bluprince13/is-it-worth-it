# Is it worth it?

A single-page app that shows what a purchase — one-off or recurring — costs you, measured in
three ways: **time**, **wealth**, and **retirement**.

- **Time** — hours, days, or weeks of work the purchase represents at your take-home hourly rate.
- **Wealth** — the purchase as a share of your net worth, and how long your investment returns
  alone take to earn it back.
- **Future** — how many days later you reach your retirement target, and what the money would be
  worth if invested instead.

Enter a few figures (take-home pay, hours, savings, net worth, retirement target, assumed return)
or leave them blank and typical UK figures are used as placeholders. Everything is calculated in
your browser — nothing is sent to a server — and a share link carries exactly the figures you
entered.

It shows the working for every number and states its assumptions. It is for illustration only and
is not financial advice.

## Developing

```bash
npm install
npm run dev       # dev server at localhost:5173
npm test          # unit tests
npm run check     # type-check
npm run build     # static site into build/
```

## Stack

SvelteKit with `adapter-static`, Svelte 5 runes, TypeScript, Tailwind v4, Vitest. Charts are
hand-written SVG.

## License

[MIT](LICENSE)
