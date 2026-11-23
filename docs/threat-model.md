# Threat model

## What the tape chain proves

The chain detects accidental corruption: a truncated write, a bad merge, a
stray edit, a partial commit. Every line commits to the one before it, so any
divergence is located exactly.

The chain does not prove authenticity. An attacker who rewrites a payload and
recomputes every subsequent hash produces a valid tape. Signing is out of scope
for 0.1.0.

## Boundary holes

Interception happens at the runtime boundary, which means anything that does
not cross the boundary is invisible:

- Native modules issuing syscalls directly (`node:sqlite`, `better-sqlite3`,
  database drivers) bypass `fs` and `fetch` entirely.
- Worker threads get a fresh global scope and the preload is not inherited.
- Code that caches `Date.now` or `fetch` in a module-level binding before the
  preload installs keeps the real one.
- `fs` is wrapped at the module boundary rather than by patching `node:fs`, so
  a named import taken before the preload sees the unwrapped function.

A run that touches any of these records an incomplete tape. It will replay, and
it will replay wrong.

## Secrets in tapes

Tapes are committed. Anything the agent read lands in the tape in plain text,
including file contents and request headers. `authorization` headers are stored
verbatim. Redact with `rewind trim` and `rewind seal` before committing, or
keep secrets out of the recorded surface.

## Sandboxing

`rewind` records; it does not sandbox. `run_shell` executes with the full
privileges of the calling process. A tape of a destructive run replays the
destructive parts for real unless `fs` writes are the only effect.
