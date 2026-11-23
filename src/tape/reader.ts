import fs from 'node:fs';
import { canonical, pick } from './canonical.js';
import { hashEvent } from './writer.js';
import { GENESIS, isKind, type Kind, type TapeEvent } from './format.js';
import { RewindError } from '../errors.js';

export class TapeReader {
  private readonly byKind = new Map<Kind, TapeEvent[]>();
  private readonly cursors = new Map<Kind, number>();
  readonly lastSeq: number;

  constructor(file: string) {
    const lines = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.length > 0);
    let prev = GENESIS;

    lines.forEach((line, index) => {
      let event: TapeEvent;
      try {
        event = JSON.parse(line) as TapeEvent;
      } catch {
        throw new RewindError('TAPE_MALFORMED', `line ${index} is not json`);
      }
      if (event.seq !== index) throw new RewindError('TAPE_SEQ_GAP', `line ${index} carries seq ${event.seq}`);
      if (!isKind(event.kind)) throw new RewindError('TAPE_UNKNOWN_KIND', `line ${index} carries kind ${event.kind}`);
      if (event.prev_hash !== prev) throw new RewindError('TAPE_TAMPERED', `line ${index} prev_hash mismatch`);
      if (hashEvent(prev, event.seq, event.kind, event.payload) !== event.hash) {
        throw new RewindError('TAPE_TAMPERED', `line ${index} hash mismatch`);
      }
      prev = event.hash;

      const bucket = this.byKind.get(event.kind) ?? [];
      bucket.push(event);
      this.byKind.set(event.kind, bucket);
      this.cursors.set(event.kind, 0);
    });

    this.lastSeq = lines.length - 1;
  }

  next(kind: Kind, request?: Record<string, unknown>): Record<string, unknown> {
    const bucket = this.byKind.get(kind) ?? [];
    const at = this.cursors.get(kind) ?? 0;
    const event = bucket[at];

    if (!event) {
      throw new RewindError('DIVERGENCE_MISSING', `no remaining ${kind}; tape ends at seq ${this.lastSeq}`, this.lastSeq);
    }

    if (request) {
      const expected = canonical(pick(event.payload, Object.keys(request)));
      if (expected !== canonical(request)) {
        throw new RewindError(
          'DIVERGENCE_MISMATCH',
          `seq ${event.seq} ${kind}\n  expected ${expected}\n  actual   ${canonical(request)}`,
          event.seq
        );
      }
    }

    this.cursors.set(kind, at + 1);
    return event.payload;
  }

  consumed(): number {
    let total = 0;
    for (const value of this.cursors.values()) total += value;
    return total;
  }
}
