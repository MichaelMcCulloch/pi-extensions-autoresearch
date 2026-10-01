import { describe, expect, it } from 'vitest';
import { initialResearch, reduceResearch, researchInvariant, type ResearchEvent } from '../src/domain.ts';
import { ResearchRuntime, scoreFromOutput, type Config, type ResearchPorts } from '../src/runtime.ts';
const config: Config = { metric: 'loss', direction: 'lower', decimals: 3, maxRuns: 3 };
const ports = (extra: Partial<ResearchPorts> = {}): ResearchPorts => ({ save() {}, changed() {}, exec: async () => ({ stdout: 'METRIC loss=1.125', stderr: '', code: 0, killed: false }), ...extra });
describe('research domain and script boundary', () => {
  it('exhausts small scores and budgets; best never regresses', () => {
    const queue = [initialResearch()], seen = new Set([JSON.stringify(queue[0])]);
    const events: ResearchEvent[] = [{ type: 'Begin' }];
    for (let ticket = 0; ticket <= 4; ticket++) {
      for (const type of ['Keep','Discard','Cancel'] as const) events.push({ type, ticket });
      for (const score of [-1,0,1]) for (const valid of [false,true]) events.push({ type: 'Measure', ticket, score, valid });
    }
    for (let i = 0; i < queue.length; i++) {
      const s = Object.freeze(queue[i]!); expect(researchInvariant(s, 3)).toBe(true);
      for (const e of events) {
        const n = reduceResearch(s,e,3), key = JSON.stringify(n);
        if (s.best !== null) expect(n.best! >= s.best).toBe(true);
        if (!seen.has(key)) { seen.add(key); queue.push(n); }
      }
    }
    expect(seen.size).toBe(95);
  });
  it('parses exact decimal units and refuses ambiguous or rounded scores', () => {
    expect(scoreFromOutput('METRIC loss=-0.125', config)).toBe(125);
    expect(() => scoreFromOutput('METRIC loss=1.1251', config)).toThrow('precision');
    expect(() => scoreFromOutput('METRIC loss=NaN', config)).toThrow('invalid');
    expect(() => scoreFromOutput('METRIC loss=1\nMETRIC loss=2', config)).toThrow('duplicate');
    expect(() => scoreFromOutput('METRIC loss=1\nMETRIC loss=NaN', config)).toThrow('duplicate');
  });
  it('failed correctness checks prevent keep; duplicate decisions are refused', async () => {
    const runtime = new ResearchRuntime(ports({ exec: async command => ({ stdout: 'METRIC loss=1', stderr: '', code: command === 'checks' ? 1 : 0, killed: false }) }), config);
    const result = await runtime.run('measure', 'checks', '/tmp', 1000);
    expect(result.valid).toBe(false);
    expect(() => runtime.decide(true,result.ticket,'')).toThrow('keep-refused');
    runtime.decide(false,result.ticket,'failed checks');
    expect(() => runtime.decide(false,result.ticket,'')).toThrow('discard-refused');
  });
  it('does not execute when persistence of admission fails', async () => {
    let calls = 0;
    const runtime = new ResearchRuntime(ports({ save() { throw new Error('disk'); }, exec: async () => { calls++; throw new Error('unexpected'); } }), config);
    await expect(runtime.run('measure', undefined, '/tmp', 100)).rejects.toThrow('disk');
    expect(calls).toBe(0); expect(runtime.snapshot.core).toEqual(initialResearch());
  });
  it('fences a branch switch and does not append a late result to the new branch', async () => {
    let resolve!: (result: Awaited<ReturnType<ResearchPorts['exec']>>) => void;
    let writes = 0;
    const runtime = new ResearchRuntime(ports({ save() { writes++; }, exec: () => new Promise(r => { resolve = r; }) }), config);
    const run = runtime.run('measure', undefined, '/tmp', 1000);
    const rejected = expect(run).rejects.toThrow('aborted'); runtime.close(); await rejected;
    resolve({ stdout: 'METRIC loss=1', stderr: '', code: 0, killed: false }); await Promise.resolve();
    expect(writes).toBe(1);
    const restored = new ResearchRuntime(ports(),config,runtime.snapshot); restored.recover();
    expect(restored.snapshot.core).toMatchObject({ phase: 'idle', settled: 1, best: null });
  });
  it('emits at most one continuation without experimental progress', () => {
    const runtime = new ResearchRuntime(ports(),config); runtime.activate(true);
    expect(runtime.takeContinuation()).toBe(true); expect(runtime.takeContinuation()).toBe(false);
  });
});
