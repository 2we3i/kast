# Contributing to Kast

Thanks for helping build a free, private, open-source résumé builder. For the
product and architecture rules (the two-layer model, what is in and out of
scope, code conventions), read [AGENTS.md](AGENTS.md) first. Changes that add
structural freedom to the résumé document (tables, columns, floating
elements) will be declined regardless of implementation quality.

## Local setup

Prerequisites: Node.js 24 and pnpm 10 (`corepack enable` picks the version
pinned in `packageManager`).

```sh
pnpm install
pnpm dev
```

The app runs at `http://localhost:4321`. There is no backend: résumé data
lives in the browser's IndexedDB. Keep it that way; no change may send résumé
content anywhere except an AI request the user explicitly confirms.

## Before opening a pull request

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm validate:exports` pass.
- Interface text exists in all three locales (`messages/en.json`, `lt.json`,
  `ru.json`); `tests/unit/messages.test.ts` enforces it.
- Changes to the résumé document shape bump `CURRENT_SCHEMA_VERSION` and add
  a migration rung in the same change (`docs/schema-migrations.md`).
- Changes to an export path keep every template's text in reading order
  (`docs/export-validation.md`).
- Test data is fictional: no real names, phone numbers, e-mail addresses, or
  photos.

## Commits

Commit messages follow the Conventional Commits format, enforced by
commitlint; husky runs lint-staged before each commit. Do not bypass the hooks.

## Code of conduct and security

All participation is covered by the [Code of Conduct](CODE_OF_CONDUCT.md).
Report security problems privately as described in [SECURITY.md](SECURITY.md).

## License

Kast is licensed under [AGPL-3.0-only](LICENSE). By contributing, you agree
that your contributions are licensed under the same terms.
