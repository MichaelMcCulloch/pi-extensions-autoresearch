/** Scores are exact signed integer units; adapters validate/quantize metrics. */
export interface ResearchState {
  phase: 'idle' | 'running' | 'measured';
  next: number;
  settled: number;
  kept: number;
  best: number | null;
  score: number | null;
  valid: boolean;
}
export type ResearchEvent =
  | { type: 'Begin' }
  | { type: 'Measure'; ticket: number; score: number; valid: boolean }
  | { type: 'Keep' | 'Discard' | 'Cancel'; ticket: number };
export const initialResearch = (): ResearchState => ({ phase: 'idle', next: 0, settled: 0, kept: 0, best: null, score: null, valid: false });
export function reduceResearch(s: ResearchState, e: ResearchEvent, limit = Number.MAX_SAFE_INTEGER): ResearchState {
  if (e.type === 'Begin') return s.phase === 'idle' && s.next < limit ? { ...s, phase: 'running', next: s.next + 1, score: null, valid: false } : s;
  if (e.ticket !== s.next) return s;
  if (e.type === 'Measure') return s.phase === 'running' && Number.isSafeInteger(e.score)
    ? { ...s, phase: 'measured', score: e.score, valid: e.valid } : s;
  if (e.type === 'Keep') return s.phase === 'measured' && s.valid && s.score !== null && (s.best === null || s.score > s.best)
    ? { ...s, phase: 'idle', settled: s.settled + 1, kept: s.kept + 1, best: s.score, score: null, valid: false } : s;
  if ((e.type === 'Discard' && s.phase === 'measured') || (e.type === 'Cancel' && s.phase !== 'idle'))
    return { ...s, phase: 'idle', settled: s.settled + 1, score: null, valid: false };
  return s;
}
export function researchInvariant(s: ResearchState, limit = Number.MAX_SAFE_INTEGER): boolean {
  return ['idle', 'running', 'measured'].includes(s.phase)
    && [s.next, s.settled, s.kept].every(n => Number.isSafeInteger(n) && n >= 0 && n <= limit)
    && s.next === s.settled + Number(s.phase !== 'idle') && s.kept <= s.settled
    && (s.best === null ? s.kept === 0 : Number.isSafeInteger(s.best) && s.kept > 0)
    && (s.phase === 'measured' ? Number.isSafeInteger(s.score) : s.score === null && !s.valid);
}
