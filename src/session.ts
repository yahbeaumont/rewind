import type { TapeWriter } from './tape/writer.js';
import type { TapeReader } from './tape/reader.js';
import type { VirtualClock, VirtualRng } from './virtual.js';

export type Mode = 'record' | 'replay';

export interface Session {
  mode: Mode;
  writer: TapeWriter | null;
  reader: TapeReader | null;
  clock: VirtualClock;
  rng: VirtualRng;
  scratch: string;
}

let current: Session | null = null;

export function getSession(): Session | null {
  return current;
}

export function setSession(session: Session | null): void {
  current = session;
}
