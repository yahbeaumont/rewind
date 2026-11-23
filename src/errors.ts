export type Code =
  | 'DIVERGENCE_MISSING'
  | 'DIVERGENCE_MISMATCH'
  | 'TAPE_MALFORMED'
  | 'TAPE_SEQ_GAP'
  | 'TAPE_UNKNOWN_KIND'
  | 'TAPE_TAMPERED'
  | 'LIVE_ACCESS_IN_REPLAY'
  | 'USAGE';

export class RewindError extends Error {
  readonly seq: number | null;

  constructor(readonly code: Code, message: string, seq: number | null = null) {
    super(message);
    this.name = code;
    this.seq = seq;
  }

  get exitCode(): number {
    if (this.code.startsWith('DIVERGENCE')) return 1;
    if (this.code === 'USAGE') return 3;
    return 2;
  }
}
