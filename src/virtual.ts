export const RealDate = Date;

export class VirtualClock {
  private wall = 0;
  private mono = 0;

  set(wall: number, mono: number): void {
    this.wall = wall;
    this.mono = mono;
  }

  wallNow(): number {
    return this.wall;
  }

  monoNow(): number {
    return this.mono;
  }
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class VirtualRng {
  constructor(private readonly next: () => number) {}
  draw(): number {
    return this.next();
  }
}

export function realIso(): string {
  return new RealDate().toISOString();
}
