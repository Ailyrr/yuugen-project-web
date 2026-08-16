# Yuugen Project — Landing Page

Creating solutions for IT, brand photoshoots / video / graphics and online
entertainment that are easy to use and understand. See the beauty in
minimalism — _yuugen_ (幽玄).

A fast, minimal, single-page marketing site for **Yuugen Project**, a studio
offering end-to-end **branding**, **IT solutions** and **online event
management**. Built as a static site served from the edge by a
**Cloudflare Worker**.

## Design

- Calm, minimal, Japanese-inspired aesthetic with generous whitespace.
- A near‑monochrome warm‑paper palette with a single muted **teal green‑blue**
  accent.
- Serif display type (_Shippori Mincho_) paired with a clean sans
  (_Zen Kaku Gothic New_).
- Subtle scroll‑reveal motion, respectful of `prefers-reduced-motion`.
- Fully responsive, accessible (skip link, focus states, semantic landmarks,
  reduced‑motion support).

## Tech & why it's fast on Cloudflare Workers

- Static assets (`public/`) are served directly by Cloudflare's asset server for
  maximum edge performance — the Worker doesn't sit in the hot path for page
  loads.
- The Worker (`src/index.ts`) only runs for `/api/*` routes (configured via
  `run_worker_first` in `wrangler.jsonc`), handling the contact form and a
  health check.
- No client framework and no runtime dependencies — just HTML, CSS and a small
  vanilla JS file.

```
.
├── public/            # static assets served at the edge
│   ├── index.html
│   ├── styles.css
│   ├── main.js
│   └── favicon.svg
├── src/
│   └── index.ts       # Worker: /api/contact, /api/health
├── wrangler.jsonc     # Cloudflare Workers config (assets + routing)
└── tsconfig.json
```

## Getting started

Requires Node 18+.

```bash
npm install
npm run dev        # local dev at http://127.0.0.1:8787
```

Other scripts:

```bash
npm run typecheck  # type-check the Worker
npm run deploy     # deploy to Cloudflare (requires `wrangler login`)
```

## API

| Method | Route           | Description                                         |
| ------ | --------------- | --------------------------------------------------- |
| `POST` | `/api/contact`  | Validates a contact submission and returns JSON.    |
| `GET`  | `/api/health`   | Health check.                                       |

The contact endpoint validates input at the edge and logs a structured event
(visible in Workers observability). To actually deliver messages, wire up a
provider inside `handleContact` in `src/index.ts` (e.g. MailChannels, Resend, a
Queue, or a KV/D1 binding). An optional `CONTACT_INBOX` var is read as the
destination hint.

## Deploying

```bash
npx wrangler login
npm run deploy
```

This publishes the Worker together with the `public/` assets to your Cloudflare
account.
