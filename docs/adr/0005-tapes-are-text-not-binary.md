# 5. Tapes are text, not binary

## Context

Tapes get committed, reviewed and diffed. They are also large: a forty-step run
is 60 to 200 KB. A binary container would cut that by an order of magnitude.

## Decision

JSONL, UTF-8, uncompressed, one event per line, fixed key order. No container
and no compression in 0.1.0.

## Alternatives considered

**MessagePack or CBOR.** Rejected. Smaller and unreadable in review, which
removes the main reason to commit a tape.

**gzip.** Rejected. Turns the artifact binary and stops git diffs from being
reviewable.

**SQLite.** Rejected. Whole-file rewrite on append, opaque diff.

## Consequences

Tapes are large for their content and repositories carrying many grow fast.
`trim --keep` drops events and re-seals, which is the remedy for fixtures that
only need a few steps. Review value dominates storage cost.
