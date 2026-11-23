import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const TAPE = 'tapes/fix-failing-test.tape';

function replay(): string {
  return execFileSync(process.execPath, ['--import', 'tsx', 'src/cli.ts', 'replay', TAPE], {
    encoding: 'utf8',
    env: { ...process.env, OPENAI_API_KEY: '' }
  });
}

describe('determinism', () => {
  it('replays twice with identical output', () => {
    const first = replay();
    const second = replay();
    expect(first).toBe(second);
    expect(first).toContain('subtracts instead of adding');
  }, 30_000);
});
