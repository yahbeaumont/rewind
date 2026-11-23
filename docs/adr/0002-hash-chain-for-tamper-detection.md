# 2. Hash-chain the tape for tamper detection

## Context

Tapes are plain text and are meant to be edited: secrets get redacted, long runs
get trimmed. Editing is normal. Silent accidental corruption is not, because a
corrupted tape can still replay and pass, which makes the pass meaningless.

## Decision

Each line stores `prev_hash`, the previous line's `hash`, and its own `hash`.
The first line seeds the chain with 64 zeros. `verify` recomputes and exits 2 on
the first mismatch. `seal` recomputes after an intentional edit.

## Alternatives considered

**No integrity.** Rejected. A tape that drifted from its recording still
replays, indistinguishably from a valid one.

**GPG signature per tape.** Rejected. Solves forgery, not accidents, and
requires key distribution with an all-or-nothing answer and no line number.

**Merkle tree.** Rejected. Sequential access only, so the proofs go unused.

## Consequences

Any hand edit invalidates the chain until sealed: a deliberate speed bump worth
one command. The chain detects accidents, not adversaries, and the docs say so.
