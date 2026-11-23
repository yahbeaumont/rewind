# Divergence

Divergence is the replay finding an input the tape does not contain. It is
always an error, always exit code 1, and never a silent fallthrough.

## Missing

The tape has no remaining event of the requested kind. Cause: the agent took a
step the recording did not. Usually a prompt change, a model change, a new tool
call, or a non-deterministic branch that did not exist at record time.

## Mismatch

The event exists but its payload differs from the request. The message names
the sequence, the kind, and prints expected against actual as canonical JSON.
Cause: a prompt edit, a tool argument change, a model or version bump.

## What to do

Read the sequence number. Events before it are stable and the failure is local
to what follows. Then choose:

- If the change is intended, re-record the tape and commit the new one.
- If the change is not intended, the tape is telling you the agent drifted.

There is no `--force`. The absence of one is deliberate: see
`docs/adr/0003-divergence-is-an-error-not-a-warning.md`.
