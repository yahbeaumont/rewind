import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import os from 'node:os';
import { TapeReader } from './tape/reader.js';
import { TapeWriter } from './tape/writer.js';
import { setSession, type Session } from './session.js';
import { VirtualClock, VirtualRng, mulberry32 } from './virtual.js';
import { installClock } from './interceptors/clock.js';
import { installNet } from './interceptors/net.js';

const tape = process.env.RW_TAPE;
const mode = process.env.RW_MODE as 'record' | 'replay' | undefined;

if (tape && mode) {
  const seed = Number(process.env.RW_SEED ?? 1);

  let git = 'unknown';
  try {
    git = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    git = 'unborn';
  }

  const session: Session = {
    mode,
    writer: mode === 'record' ? new TapeWriter(tape) : null,
    reader: mode === 'replay' ? new TapeReader(tape) : null,
    clock: new VirtualClock(),
    rng: new VirtualRng(mulberry32(seed)),
    scratch: process.env.RW_SCRATCH ?? `${os.tmpdir()}/rw-scratch`
  };

  if (mode === 'replay') mkdirSync(session.scratch, { recursive: true });

  setSession(session);
  installClock();
  installNet();

  if (mode === 'record') {
    session.writer?.append('run.start', {
      task: process.env.RW_TASK ?? '',
      agent: process.env.RW_AGENT ?? '',
      seed,
      cwd: process.cwd(),
      git,
      node: process.version,
      platform: `${process.platform}-${process.arch}`
    });
  }

  process.on('exit', () => {
    if (mode !== 'record' || !session.writer) return;
    const result = (globalThis as unknown as { __rw?: { status: string; steps: number; output: string } }).__rw;
    session.writer.append('run.end', {
      status: result?.status ?? 'error',
      steps: result?.steps ?? 0,
      output: result?.output ?? ''
    });
    session.writer.close();
  });
}
