import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { TapeWriter, sealTape } from '../src/tape/writer.js';
import { TapeReader } from '../src/tape/reader.js';

function build(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'rw-test-'));
  const file = path.join(dir, 't.tape');
  const writer = new TapeWriter(file);
  writer.append('run.start', { task: 'x', agent: 'true', seed: 1, cwd: '/', git: 'a', node: 'v22', platform: 'linux-x64' });
  writer.append('clock.now', { wall: 1, mono: 1 });
  writer.append('run.end', { status: 'ok', steps: 1, output: '' });
  writer.close();
  return file;
}

describe('tape format', () => {
  it('round-trips a valid tape', () => {
    const file = build();
    const reader = new TapeReader(file);
    expect(reader.lastSeq).toBe(2);
  });

  it('rejects a tampered payload', () => {
    const file = build();
    const lines = readFileSync(file, 'utf8').split('\n');
    lines[1] = lines[1]!.replace('"wall":1', '"wall":9');
    writeFileSync(file, lines.join('\n'));
    expect(() => new TapeReader(file)).toThrow(/hash mismatch/);
  });

  it('rejects a sequence gap', () => {
    const file = build();
    const lines = readFileSync(file, 'utf8').split('\n').filter((l) => l.length > 0);
    const broken = path.join(path.dirname(file), 'gap.tape');
    writeFileSync(broken, `${lines[0]}\n${lines[2]}\n`);
    expect(() => new TapeReader(broken)).toThrow(/seq/);
  });

  it('accepts a re-sealed tape', () => {
    const file = build();
    const lines = readFileSync(file, 'utf8').split('\n');
    lines[1] = lines[1]!.replace('"wall":1', '"wall":9');
    writeFileSync(file, lines.join('\n'));
    sealTape(file);
    expect(() => new TapeReader(file)).not.toThrow();
  });
});
