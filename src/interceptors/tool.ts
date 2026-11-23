import { getSession } from '../session.js';
import { CAPABILITIES, execTool } from '../tools.js';

export async function runTool(name: string, args: Record<string, unknown>): Promise<string> {
  const session = getSession();
  const request = { name, args, capability: CAPABILITIES[name] ?? 'unknown' };
  if (!session) return execTool(name, args);

  if (session.mode === 'record') {
    session.writer?.append('tool.request', request);
    try {
      const value = await execTool(name, args);
      session.writer?.append('tool.response', { ok: true, value, error: null });
      return value;
    } catch (error) {
      session.writer?.append('tool.response', { ok: false, value: null, error: String(error) });
      throw error;
    }
  }

  session.reader?.next('tool.request', request);
  const response = session.reader?.next('tool.response') as { ok: boolean; value: string; error: string | null };
  if (!response.ok) throw new Error(response.error ?? 'tool failed');
  return response.value;
}
