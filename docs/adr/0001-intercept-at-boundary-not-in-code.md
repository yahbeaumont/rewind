# 1. Intercept at the runtime boundary, not in agent code

## Context

Recording requires capturing every input an agent reads. That can happen inside
the agent, through explicit recording calls, or outside it, by replacing the
primitives it already uses.

In-code recording is typed and greppable. It also couples every tape to one
agent implementation and depends on every tool author remembering to record. A
tool that forgets yields a tape that replays wrong rather than failing, which is
worse than no tape.

## Decision

Intercept at the boundary only: `fetch`, `Date`, `performance.now`,
`Math.random`, `crypto.randomUUID`, plus `fs` wrapped at the module boundary in
`src/interceptors/fs.ts`. Loading happens through a preload
(`--import ./src/preload.ts`). `src/agent.ts` imports nothing from `src/tape`.

## Alternatives considered

**Explicit SDK calls.** Rejected. Requires adoption by every tool, fails
silently when forgotten, and the resulting tapes are not portable.

**Build-time transform via a loader.** Rejected. Breaks under bundlers and
points stack traces at generated code.

**Wrapper process.** Rejected for 0.1.0. Covers network and spawn, not the
clock, the RNG, or `fs` without a filesystem namespace.

## Consequences

Tapes are agent-agnostic. The cost is a mandatory preload step, easy to omit in
a fresh shell, and a known hole: native modules issuing syscalls directly bypass
the boundary. That hole is documented in `docs/threat-model.md` rather than
papered over.
