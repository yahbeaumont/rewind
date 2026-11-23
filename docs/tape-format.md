# Tape format

A tape records everything a single agent run read from the outside world. It
exists so the run can be repeated without the outside world.

JSONL, UTF-8, LF, one object per line, no blank lines, trailing newline. Path
`tapes/<slug>.tape`.

Key order is fixed: `seq`, `kind`, `ts`, `payload`, `prev_hash`, `hash`.

## Fields

| Field | Type | Description |
|---|---|---|
| `seq` | integer | 0-based, gapless |
| `kind` | string | one of the kinds below |
| `ts` | string | ISO-8601, milliseconds, `Z`. Not hashed |
| `payload` | object | kind-specific |
| `prev_hash` | string | 64 hex, the previous line's `hash`; 64 zeros on the first line |
| `hash` | string | 64 hex, see below |

    hash = sha256(prev_hash + "\n" + seq + "\n" + kind + "\n" + canonical_json(payload))

`ts` sits outside the hash so re-sealing after a redaction keeps event identity.
`canonical_json` sorts keys, drops `undefined`, and formats numbers via
`toPrecision(17)`.

## Kinds

| `kind` | `payload` |
|---|---|
| `run.start` | `{ task, agent, seed, cwd, git, node, platform }` |
| `run.end` | `{ status, steps, output }` |
| `run.error` | `{ name, message, step }` |
| `model.request` | `{ model, messages, tools, temperature, max_tokens }` |
| `model.response` | `{ content, tool_calls, usage }` |
| `tool.request` | `{ name, args, capability }` |
| `tool.response` | `{ ok, value, error }` |
| `clock.now` | `{ wall, mono }` |
| `rng.draw` | `{ float }` |
| `net.request` | `{ method, url, headers, body }` |
| `net.response` | `{ status, headers, body }` |
| `fs.read` | `{ path, bytes, sha256, content }` |
| `fs.write` | `{ path, bytes, sha256, content }` |

## Validation

In order, per line: parses as JSON, `seq` equals index, `kind` known,
`prev_hash` matches, `hash` recomputes. Failures are `TAPE_MALFORMED`,
`TAPE_SEQ_GAP`, `TAPE_UNKNOWN_KIND`, `TAPE_TAMPERED`, all exit 2. Validation
completes for the whole tape before replay starts.

## Comparison

Each interceptor pulls the next event of its own kind. When it supplies a
request, the reader compares the canonical form of that request against the same
keys of the recorded payload. Extra keys in the payload are not compared;
missing keys are a mismatch.
