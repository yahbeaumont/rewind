#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import { TapeReader } from './tape/reader.js';
import { sealTape } from './tape/writer.js';
import { replay } from './replay.js';
import { diff } from './diff.js';
import { RewindError } from './errors.js';

const program = new Command();
program.name('rewind').version('0.1.0');

program
  .command('record')
  .argument('<task>')
  .option('--agent <cmd>', 'agent command', 'node --import tsx --import ./src/preload.ts ./src/agent.ts')
  .action(async (task: string, options: { agent: string }) => {
    if (!/^[a-z0-9-]+$/.test(task)) throw new RewindError('USAGE', 'task must be lowercase kebab-case');
    const tape = path.join('tapes', `${task}.tape`);
    mkdirSync('tapes', { recursive: true });
    const seed = Math.floor(Math.random() * 2 ** 31);
    const env = {
      ...process.env,
      RW_TAPE: tape,
      RW_MODE: 'record',
      RW_TASK: task,
      RW_AGENT: options.agent,
      RW_SEED: String(seed)
    };
    const code = await new Promise<number>((resolve) => {
      const child = spawn(`${options.agent} ${task}`, { shell: true, stdio: 'inherit', env });
      child.on('exit', (c) => resolve(c ?? 1));
    });
    if (code === 0) process.stdout.write(`sealed ${tape}\n`);
    process.exitCode = code;
  });

program
  .command('replay')
  .argument('<tape>')
  .option('--agent <cmd>', 'override agent command')
  .action(async (tape: string, options: { agent?: string }) => {
    process.exitCode = await replay({ tape, agent: options.agent ?? null });
  });

program
  .command('diff')
  .argument('<tape>')
  .option('--agent <cmd>', 'override agent command')
  .action(async (tape: string, options: { agent?: string }) => {
    process.exitCode = await diff(tape, options.agent ?? null);
  });

program
  .command('verify')
  .argument('<tape>')
  .action((tape: string) => {
    const reader = new TapeReader(tape);
    process.stdout.write(`ok ${tape} (${reader.lastSeq + 1} events)\n`);
  });

program
  .command('seal')
  .argument('<tape>')
  .action((tape: string) => {
    const count = sealTape(tape);
    process.stdout.write(`sealed ${tape} (${count} events)\n`);
  });

program.parseAsync().catch((error: unknown) => {
  const failure = error as RewindError;
  process.stderr.write(`${failure.message}\n`);
  process.exitCode = failure.exitCode ?? 2;
});
