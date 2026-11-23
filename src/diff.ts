import { replay } from './replay.js';
import { RewindError } from './errors.js';

export async function diff(tape: string, agent: string | null): Promise<number> {
  try {
    const code = await replay({ tape, agent });
    process.stdout.write(code === 0 ? 'diff: 0 lines\n' : `exit: ${code}\n`);
    return code;
  } catch (error) {
    if (error instanceof RewindError) {
      process.stdout.write(`--- tape\n+++ run\n${error.message}\n`);
      return error.exitCode;
    }
    throw error;
  }
}
