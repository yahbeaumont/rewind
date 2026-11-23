import { getSession } from '../session.js';
import { RealDate } from '../virtual.js';

// Captured before installClock replaces the global, so a call that must stay
// real never re-enters the interceptor.
const realMono = performance.now.bind(performance);

// The module loader reads the clock while it compiles modules. Those reads are
// not inputs of the agent, and their number depends on the loader's cache, so
// they must not reach the tape.
function fromLoader(): boolean {
  const stack = new Error().stack;
  if (!stack) return false;
  return stack.includes('node:internal/modules') || stack.includes('/tsx/dist/');
}

function wall(): number {
  const session = getSession();
  if (!session || fromLoader()) return RealDate.now();

  if (session.mode === 'record') {
    const now = RealDate.now();
    session.writer?.append('clock.now', { wall: now, mono: realMono() });
    session.clock.set(now, realMono());
    return now;
  }

  const event = session.reader?.next('clock.now') as { wall: number; mono: number };
  session.clock.set(event.wall, event.mono);
  return event.wall;
}

function mono(): number {
  const session = getSession();
  if (!session || fromLoader()) return realMono();

  if (session.mode === 'record') {
    const now = RealDate.now();
    const m = realMono();
    session.writer?.append('clock.now', { wall: now, mono: m });
    session.clock.set(now, m);
    return m;
  }

  const event = session.reader?.next('clock.now') as { wall: number; mono: number };
  session.clock.set(event.wall, event.mono);
  return event.mono;
}

function float(): number {
  const session = getSession();
  if (!session) return Math.random();

  if (session.mode === 'record') {
    const value = session.rng.draw();
    session.writer?.append('rng.draw', { float: value });
    return value;
  }

  const event = session.reader?.next('rng.draw') as { float: number };
  return event.float;
}

function uuid(): string {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 32; i += 1) {
    out += hex[Math.floor(float() * 16) % 16];
    if (i === 7 || i === 11 || i === 15 || i === 19) out += '-';
  }
  return out.replace(/^(.{14})./, '$1' + '4').replace(/^(.{19})./, '$1' + (hex[8 + Math.floor(float() * 4)] ?? 'a'));
}

export function installClock(): void {
  class VirtualDate extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) super(wall());
      else if (args.length === 1) super(args[0]);
      else super(args[0], args[1], args[2] ?? 1, args[3] ?? 0, args[4] ?? 0, args[5] ?? 0, args[6] ?? 0);
    }

    static now(): number {
      return wall();
    }
  }

  globalThis.Date = VirtualDate as DateConstructor;
  Math.random = float;
  performance.now = mono;

  const cryptoRef = globalThis.crypto as unknown as { randomUUID?: () => string };
  cryptoRef.randomUUID = uuid;
}
