export const KINDS = [
  'run.start',
  'run.end',
  'run.error',
  'model.request',
  'model.response',
  'tool.request',
  'tool.response',
  'clock.now',
  'rng.draw',
  'net.request',
  'net.response',
  'fs.read',
  'fs.write'
] as const;

export type Kind = (typeof KINDS)[number];

export interface TapeEvent {
  seq: number;
  kind: Kind;
  ts: string;
  payload: Record<string, unknown>;
  prev_hash: string;
  hash: string;
}

export const GENESIS = '0'.repeat(64);

export function isKind(value: string): value is Kind {
  return (KINDS as readonly string[]).includes(value);
}
