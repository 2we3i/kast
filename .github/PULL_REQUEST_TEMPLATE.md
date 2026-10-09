# Summary

<!-- What does this PR do, and why? Link the issue it addresses if there is one. -->

## How was this tested?

<!-- Manual steps, browsers checked, screenshots for UI changes. -->

## Checklist

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm validate:exports` pass; commits were made without `--no-verify`.
- [ ] Interface text is present in `en`, `lt`, and `ru`.
- [ ] No résumé content leaves the browser except in an AI request the user confirms.
- [ ] The structural layer is intact: presentation-only styling, no tables, columns, or floating elements in the document model.
- [ ] If the export path changed: every template's text still reads back in order.
- [ ] If the résumé schema changed: schema version bumped and a migration rung added.
- [ ] Test data is fictional (no real names, phones, e-mails, or photos).
