# 4. No semantic normalization of payloads

## Context

Matching could be loosened: sort keys, strip whitespace, coerce `temperature`
against `top_p`, ignore model version suffixes, ignore volatile fields. Every
rule makes more replays pass.

## Decision

Compare the canonical form of the whole request projection. Canonicalization is
limited to key order, number formatting and omission of `undefined`. No field is
ignored and no value is coerced. `ts` sits outside the payload and outside the
hash, so wall-clock noise never enters a comparison.

## Alternatives considered

**Similarity threshold.** Rejected. A numeric knob whose correct value is
unknowable and gets set to whatever makes the suite green.

**Ignore-list of fields.** Rejected for 0.1.0. Every ignored field is somewhere
real divergence hides.

**Per-provider normalizers.** Rejected. Couples the format to provider APIs,
which then need versioning inside the format.

## Consequences

Irrelevant payload changes break tapes loudly. Mitigation is cheap — re-record —
and the alternative is a suite that quietly stops testing. Clock and RNG are
already virtualized, so the volatile sources never reach a payload.
