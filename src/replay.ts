import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TapeReader } from './tape/reader.js';
import { RewindError } from './errors.js';

export interface ReplayOptions {
  tape: string;
  agent: string | null;
}

export async function replay(options: ReplayOptions): Promise<number> {
  const reader = new TapeReader(options.tape);
  const start = reader.next('run.start') as { agent: string; seed: number; task: string };
  const command = options.agent ?? start.agent;

  if (!command) throw new RewindError('USAGE', 'no agent command in tape and none supplied');

  const scratch = mkdtempSync(path.join(os.tmpdir(), 'rw-'));
  const env = {
    ...process.env,
    RW_TAPE: options.tape,
    RW_MODE: 'replay',
    RW_SCRATCH: scratch,
    RW_SEED: String(start.seed)
  };

  return await new Promise<number>((resolve) => {
    // record spawns `<agent> <task>`, so replay has to do the same or the agent
    // starts without the argument the tape was recorded with.
    const child = spawn(`${command} ${start.task}`, { shell: true, stdio: 'inherit', env });
    child.on('exit', (code) => resolve(code ?? 1));
  });
}
