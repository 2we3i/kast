# Security Policy

Kast is local-first: résumé content is stored only in the user's browser
(IndexedDB) and is never sent to a server. The only outbound requests are AI
calls the user starts with their own key. That narrows the attack surface but
does not eliminate it. Vulnerabilities we care about include:

- Script injection through résumé content or imported files (the editor
  renders rich text and imported data into the preview and exports)
- Any code path that would send résumé data off the device other than an AI
  request the user confirmed, including through exports or the service worker
- Leaks of an API key: to storage in plain text, to exports or backups, or to
  any host other than the chosen provider
- Supply-chain issues in dependencies that ship to the client

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub's private
vulnerability reporting on this repository (Security → Report a
vulnerability). Do not open a public issue or pull request for a security
problem.

Include a description of the issue and the affected code path, steps to
reproduce or a proof of concept, and your assessment of the impact.

## Supported versions

Kast is a continuously deployed web application; only the tip of `master` is
supported. If you self-host a fork, please confirm the issue reproduces on
the current code before reporting.
