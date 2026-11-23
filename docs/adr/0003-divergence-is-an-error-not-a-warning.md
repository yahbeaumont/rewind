# 3. Divergence is an error, not a warning

## Context

When replay reaches an input the tape does not contain, the choice is to fail or
to fall through to the live world and continue. Falling through is friendlier
and always produces output. It also means the second execution is not the first,
and a green result stops implying reproduction.

## Decision

Hard fail. `DIVERGENCE_MISSING` or `DIVERGENCE_MISMATCH`, exit 1, naming the
`seq` and `kind`. No fallthrough, no `--allow-live`.

## Alternatives considered

**Warn and continue.** Rejected. Produces a hybrid execution, unreproducible by
construction, reported as success.

**`--allow-live` flag.** Rejected for 0.1.0. Escape hatches become defaults.

**Partial replay with coverage.** Deferred, and only once the strict path is the
only path.

## Consequences

Replay is airtight and unforgiving. A tape is bound to the exact agent version,
prompt and environment that produced it, so active development breaks tapes on
purpose.
