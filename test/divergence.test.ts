import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { sealTape } from '../src/tape/writer.js';

function truncate(source: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'rw-div-'));
  const target = path.join(dir, 'trunc.tape');
  const lines = readFileSync(source, 'utf8').split('\n').filter((l) => l.length > 0);
  writeFileSync(target, `${lines.slice(0, 4).join('\n')}\n`);
  sealTape(target);
  return target;
}

describe('divergence', () => {
  it('exits 1 and names the sequence when the tape runs out', () => {
    const tape = truncate('tapes/fix-failing-test.tape');
    let code = 0;
    let stderr = '';
    try {
      execFileSync(process.execPath, ['--import', 'tsx', 'src/cli.ts', 'replay', tape], {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, OPENAI_API_KEY: '' }
      });
    } catch (error) {
      const failure = error as { status: number; stderr: string };
      code = failure.status;
      stderr = failure.stderr;
    }
    expect(code).toBe(1);
    expect(stderr).toMatch(/DIVERGENCE|no remaining/);
  }, 30_000);
});
