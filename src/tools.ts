import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from './interceptors/fs.js';

export const CAPABILITIES: Record<string, string> = {
  read_file: 'fs:read',
  write_file: 'fs:write',
  run_shell: 'proc:spawn'
};

export const TOOL_SCHEMAS = [
  {
    name: 'read_file',
    description: 'Read a UTF-8 file and return its contents.',
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] }
  },
  {
    name: 'write_file',
    description: 'Write a UTF-8 file, replacing its contents.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' }, content: { type: 'string' } },
      required: ['path', 'content']
    }
  },
  {
    name: 'run_shell',
    description: 'Run a shell command and return stdout and stderr.',
    parameters: { type: 'object', properties: { cmd: { type: 'string' } }, required: ['cmd'] }
  }
];

export async function execTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'read_file':
      return readFile(String(args.path));
    case 'write_file':
      writeFile(String(args.path), String(args.content));
      return `wrote ${String(args.path)}`;
    case 'run_shell':
      try {
        return execFileSync('bash', ['-lc', String(args.cmd)], { encoding: 'utf8', stdio: 'pipe' });
      } catch (error) {
        const failure = error as { stdout?: string; stderr?: string };
        return `${failure.stdout ?? ''}${failure.stderr ?? ''}`.trim() || 'command failed';
      }
    default:
      throw new Error(`unknown tool ${name}`);
  }
}
