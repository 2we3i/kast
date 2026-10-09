<p align="center">
  <img src="public/brand/kast-mark.svg" alt="" width="64" height="64" />
</p>

<h1 align="center">Kast</h1>

<p align="center">
  A free, private résumé builder that passes applicant tracking systems.<br />
  Lithuanian, English, and Russian. No account, no tracking, nothing uploaded.
</p>

## What it is

Kast builds résumés entirely in the browser. Documents live in the browser's
IndexedDB and never reach a server; the site itself is a set of static files.
An optional AI assistant works with the user's own Anthropic or Google key,
sending requests straight from the browser to the provider after consent.

Every résumé has two layers:

- **Structure**: fixed section types with a restricted rich-text schema
  (bold, italic, lists, links). This is what parsers read, and it never
  changes with the design.
- **Presentation**: template, typography, spacing, accent color, photo, icons,
  QR code. Fully customizable, and checked to leave the extracted text
  identical.

## Features

- **Ten templates**, each with a strict **ATS mode** (no photo, icons, or
  color) and a **design mode** (accent color, contact icons, photo, QR code)
- **Interface in LT / EN / RU**; each résumé has its own language, so headings,
  dates, and levels follow the document, not the interface
- **Sections**: summary, experience, internships, projects, organizations,
  volunteering, education, courses, certifications, publications, skills with
  level and description, languages rated for speaking, understanding, and
  writing (CEFR), hobbies, references, driving licence, salary expectations,
  availability, and custom sections; hide any section, reorder by drag or
  keyboard
- **ATS check**, local and rule-based (`src/lib/ats/ats-rules.json`): a 0–100
  score by category with a fix for every finding, a keyword match against the
  vacancy text, and a check that reads the real PDF's text layer back in
  reading order
- **PDF import** with column and sidebar detection, page-furniture filtering
  (page numbers, portal footers, watermarks), tenure and level badges kept as
  metadata, LT/EN/RU heading dictionaries, a date parser, per-field confidence,
  and a review step before anything is saved; 20 fictional test PDFs, 100%
  sections-and-dates accuracy
- **Multiple résumés**: duplicate, rename, a vacancy label (company, position,
  link, date, status, notes) with a status filter, and version history of the
  last 20 snapshots with rollback
- **Photo** with in-browser crop and compression
- **Cover letter** in the résumé's design and language
- **Exports**: PDF with a real text layer, DOCX with real heading and list
  styles, plain text, JSON, YAML, and Europass XML / JSON
- **AI assistant (optional)**: improve wording, tailor to a vacancy, ATS
  review, consistency check, translation, cover letter, and import cleanup;
  personal data masked before sending, a diff to accept, reject, or edit each
  change, token and cost estimate, cancel, and a batch mode for several résumés
- **Spell check** in the résumé's language, word and page counter with a
  warning past two pages
- **Installable PWA** that works offline; backup and restore of all data in
  one file; "delete all data"

## Privacy

- No accounts, analytics, cookies, or third-party requests by default.
- The only outbound requests are AI calls the user starts, to the provider
  they chose; the page's Content Security Policy allows nothing else.
- API keys stay in memory, or encrypted with a user password (PBKDF2 +
  AES-GCM) if the user opts in. They are never part of a backup or export.

The full policy is at `/privacy` on any deployment.

## Development

Prerequisites: Node.js 24 and pnpm 10 (`corepack enable` picks the pinned
version).

```sh
pnpm install
pnpm dev
```

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server at http://localhost:4321 |
| `pnpm build` | OG images, static build to `dist/`, offline service worker |
| `pnpm preview` | Serve the built site |
| `pnpm lint` / `pnpm format` | Biome check / format |
| `pnpm typecheck` | `astro check` |
| `pnpm test` / `pnpm test:coverage` | Vitest unit and integration tests |
| `pnpm validate:exports` | Every template's PDF, plus DOCX and TXT, read back in order |
| `pnpm fixtures:import` / `pnpm fixtures:kast` | Regenerate the fictional import fixtures |
| `pnpm brand` | Rebuild favicons and PWA icons from the mark |
| `pnpm fonts` | Rebuild the bundled résumé fonts (Python, fontTools) |

Only fictional résumés belong in the repository: no real names, phone
numbers, e-mail addresses, or photos.

## Deployment

The repository ships a `Dockerfile` (Node build, Caddy serving `dist/`) and a
`railway.json`. Any static host works too: serve `dist/` with
`try_files {path} {path}.html {path}/index.html`.

Build-time environment:

| Variable | Purpose |
| --- | --- |
| `PUBLIC_SITE_URL` | The deployment's address, for canonical links and the sitemap |
| `PUBLIC_SOURCE_URL` | This repository's URL, shown as "Source code" (required by AGPL-3.0 §13 for modified deployments) |

## Tech stack

Astro (static) with React islands, Tailwind CSS, shadcn/ui (Base UI),
TipTap, react-hook-form + zod, zustand, IndexedDB via idb, takumi-pdf
(WebAssembly) for PDF, docx, pdf.js via unpdf for import, use-intl, ts-belt,
Biome, Vitest.

## Credits and license

Kast started as a fork of [Lanjut](https://github.com/rimzzlabs/lanjut) by
Rizki Maulana Citra. Licensed under [AGPL-3.0-only](LICENSE).
