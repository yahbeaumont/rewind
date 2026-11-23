import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { canonical } from './canonical.js';
import { GENESIS, isKind, type Kind } from './format.js';
import { realIso } from '../virtual.js';

export function hashEvent(prev: string, seq: number, kind: string, payload: unknown): string {
  return createHash('sha256').update(`${prev}\n${seq}\n${kind}\n${canonical(payload)}`).digest('hex');
}

export class TapeWriter {
  private seq = 0;
  private prev = GENESIS;
  private readonly fd: number;

  constructor(file: string) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.fd = fs.openSync(file, 'w');
  }

  append(kind: Kind, payload: Record<string, unknown>): void {
    const hash = hashEvent(this.prev, this.seq, kind, payload);
    const line = JSON.stringify({
      seq: this.seq,
      kind,
      ts: realIso(),
      payload,
      prev_hash: this.prev,
      hash
    });
    fs.writeSync(this.fd, `${line}\n`);
    this.prev = hash;
    this.seq += 1;
  }

  close(): void {
    fs.closeSync(this.fd);
  }
}

export function sealTape(file: string): number {
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.length > 0);
  let prev = GENESIS;
  let seq = 0;
  const sealed: string[] = [];

  for (const line of lines) {
    const parsed = JSON.parse(line) as { kind: string; ts: string; payload: Record<string, unknown> };
    if (!isKind(parsed.kind)) throw new Error(`unknown kind ${parsed.kind} at seq ${seq}`);
    const hash = hashEvent(prev, seq, parsed.kind, parsed.payload);
    sealed.push(
      JSON.stringify({ seq, kind: parsed.kind, ts: parsed.ts, payload: parsed.payload, prev_hash: prev, hash })
    );
    prev = hash;
    seq += 1;
  }

  fs.writeFileSync(file, `${sealed.join('\n')}\n`);
  return seq;
}
