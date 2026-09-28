# Hacker Club

The global arena for coding competitions and online hackathons — compete from anywhere, get judged instantly, win real prizes.

**Live site:** https://bittu25.github.io/hacker-club/

## Pages

| Page | File |
|---|---|
| Home | `index.html` |
| Contests list / detail | `contests.html`, `contest.html?id=…` |
| Hackathons list / detail | `hackathons.html`, `hackathon.html?id=…` |
| Coding arena (in-browser editor + judge) | `arena.html` |
| Global leaderboard | `leaderboard.html` |
| Pricing & host an event | `pricing.html` |
| Personal dashboard | `dashboard.html` |
| About & contact | `about.html` |

## How it's built

A static site — plain HTML, CSS and JavaScript, no build step.

- `assets/css/styles.css` — all styles
- `assets/js/data.js` — **all content**: contests, hackathons, problems, leaderboard. Edit this to change events.
- `assets/js/app.js` — shared logic: navigation, accounts, registration/checkout, command palette (Ctrl/⌘ + K), toasts, countdowns
- `assets/js/*.js` — one script per page

## Current limitations (demo mode)

- Accounts, registrations and submissions are stored in the visitor's browser (`localStorage`) only.
- Checkout and Pro upgrades are demos — no payments are taken.
- The arena executes **JavaScript** solutions in the browser; other languages need a server-side judge.
- Contact and "host an event" forms don't send anywhere yet.
- Events, stats and hacker names are sample data.

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173

## Deploy

Hosted on GitHub Pages from the `main` branch. Every push to `main` updates the live site within a minute or two.
