import { initialResearch, reduceResearch, researchInvariant, type ResearchEvent, type ResearchState } from './domain.ts';

export interface Config { metric: string; direction: 'higher' | 'lower'; decimals: number; maxRuns: number }
export interface Measurement { stdout: string; stderr: string; code: number; killed: boolean }
export interface RecordEntry { ticket: number; outcome: 'kept' | 'discarded' | 'cancelled'; score: number | null; valid: boolean; description: string }
export interface Snapshot { version: 1; config: Config; core: ResearchState; history: RecordEntry[]; active: boolean }
export interface ResearchPorts {
  save(snapshot: Snapshot): void;
  changed(snapshot: Snapshot, event: ResearchEvent): void;
  exec(command: string, cwd: string, timeoutMs: number, signal: AbortSignal): Promise<Measurement>;
}
export function validateConfig(c: Config): void {
  if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(c.metric) || !['higher', 'lower'].includes(c.direction)
    || !Number.isInteger(c.decimals) || c.decimals < 0 || c.decimals > 9
    || !Number.isSafeInteger(c.maxRuns) || c.maxRuns < 1) throw new Error('autoresearch-invalid-config');
}
/** Parse decimal text without rounding. One occurrence of the configured metric is required. */
export function scoreFromOutput(stdout: string, config: Config): number {
  const values = stdout.split(/\r?\n/).map(line => /^METRIC\s+([A-Za-z_][A-Za-z0-9_.-]*)=(.*?)\s*$/.exec(line))
    .filter(match => match?.[1] === config.metric);
  if (values.length !== 1) throw new Error('autoresearch-metric-missing-or-duplicate');
  const text = values[0]![2]!;
  if (!/^-?\d+(?:\.\d+)?$/.test(text) || text.length > 64) throw new Error('autoresearch-invalid-metric');
  const [whole, fraction = ''] = text.replace(/^-/, '').split('.');
  if (fraction.length > config.decimals && /[1-9]/.test(fraction.slice(config.decimals))) throw new Error('autoresearch-metric-precision');
  const units = BigInt(whole!) * 10n ** BigInt(config.decimals) + BigInt(fraction.slice(0, config.decimals).padEnd(config.decimals, '0') || '0');
  const signed = units * (text.startsWith('-') ? -1n : 1n) * (config.direction === 'lower' ? -1n : 1n);
  const score = Number(signed);
  if (!Number.isSafeInteger(score)) throw new Error('autoresearch-metric-range');
  return score;
}
export class ResearchRuntime {
  #snapshot: Snapshot;
  #abort: AbortController | undefined;
  #closed = false;
  #lastContinuation = -1;
  constructor(private readonly ports: ResearchPorts, config: Config, snapshot?: Snapshot) {
    validateConfig(config);
    this.#snapshot = snapshot ? structuredClone(snapshot) : { version: 1, config: { ...config }, core: initialResearch(), history: [], active: false };
    if (this.#snapshot.version !== 1 || !researchInvariant(this.#snapshot.core, config.maxRuns)) throw new Error('autoresearch-invalid-snapshot');
  }
  get snapshot(): Snapshot { return structuredClone(this.#snapshot); }
  #save(next: Snapshot, event?: ResearchEvent): void {
    if (this.#closed) throw new Error('autoresearch-session-closed');
    // Commit state only after persistence succeeds. Notifications are subsequent.
    this.ports.save(structuredClone(next));
    this.#snapshot = next;
    if (event) this.ports.changed(this.snapshot, event);
  }
  #apply(event: ResearchEvent, description = ''): void {
    const old = this.#snapshot;
    const core = reduceResearch(old.core, event, old.config.maxRuns);
    if (core === old.core) throw new Error(`autoresearch-${event.type.toLowerCase()}-refused`);
    const history = [...old.history];
    if (core.settled > old.core.settled) history.push({ ticket: old.core.next, outcome: event.type === 'Keep' ? 'kept' : event.type === 'Discard' ? 'discarded' : 'cancelled', score: old.core.score, valid: old.core.valid, description });
    this.#save({ ...old, core, history, active: old.active && core.next < old.config.maxRuns }, event);
  }
  activate(active: boolean): void { this.#save({ ...this.#snapshot, active }); }
  takeContinuation(): boolean {
    const s = this.#snapshot;
    if (!s.active || s.core.phase !== 'idle' || s.core.next >= s.config.maxRuns || this.#lastContinuation === s.core.next) return false;
    this.#lastContinuation = s.core.next;
    return true;
  }
  recover(): void {
    if (this.#snapshot.core.phase === 'running') this.#apply({ type: 'Cancel', ticket: this.#snapshot.core.next }, 'Interrupted process; measurement not replayed.');
    this.activate(false);
  }
  decide(keep: boolean, ticket: number, description: string): void { this.#apply({ type: keep ? 'Keep' : 'Discard', ticket }, description); }
  cancel(): void {
    if (this.#snapshot.core.phase !== 'idle') this.#apply({ type: 'Cancel', ticket: this.#snapshot.core.next });
    this.#abort?.abort();
  }
  close(): void {
    // Branch switches cannot append old-session state onto the destination branch.
    this.#closed = true; this.#abort?.abort();
  }
  async run(command: string, checks: string | undefined, cwd: string, timeoutMs: number, signal?: AbortSignal, executePort = this.ports.exec): Promise<{ ticket: number; measurement: Measurement; checks?: Measurement; score: number | null; valid: boolean; error?: string }> {
    if (signal?.aborted) throw new Error('autoresearch-aborted');
    if (!command.trim() || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 2_147_483_647) throw new Error('autoresearch-invalid-run');
    this.#apply({ type: 'Begin' });
    const ticket = this.#snapshot.core.next;
    const abort = new AbortController(); this.#abort = abort;
    const forward = (): void => abort.abort();
    signal?.addEventListener('abort', forward, { once: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    let rejectAbort: () => void = () => {};
    const interrupted = new Promise<never>((_, reject) => {
      rejectAbort = () => reject(new Error('autoresearch-aborted'));
      abort.signal.addEventListener('abort', rejectAbort, { once: true });
      timer = setTimeout(() => abort.abort(), timeoutMs);
    });
    try {
      if (signal?.aborted) abort.abort();
      const execute = async (script: string): Promise<Measurement> => {
        if (abort.signal.aborted) throw new Error('autoresearch-aborted');
        return Promise.race([interrupted, executePort(script, cwd, timeoutMs, abort.signal)]);
      };
      const measurement = await execute(command);
      let score = 0, error: string | undefined;
      try { score = scoreFromOutput(measurement.stdout, this.#snapshot.config); }
      catch (cause) { error = String(cause); }
      const checked = checks && measurement.code === 0 && !measurement.killed && !error ? await execute(checks) : undefined;
      const valid = !error && measurement.code === 0 && !measurement.killed && (!checked || (checked.code === 0 && !checked.killed));
      if (abort.signal.aborted) throw new Error('autoresearch-aborted');
      this.#apply({ type: 'Measure', ticket, score, valid });
      return { ticket, measurement, ...(checked ? { checks: checked } : {}), score: error ? null : score, valid, ...(error ? { error } : {}) };
    } catch (error) {
      if (!this.#closed && this.#snapshot.core.next === ticket && this.#snapshot.core.phase === 'running') this.#apply({ type: 'Cancel', ticket }, String(error));
      throw error;
    } finally {
      clearTimeout(timer); signal?.removeEventListener('abort', forward);
      abort.signal.removeEventListener('abort', rejectAbort);
      if (this.#abort === abort) this.#abort = undefined;
    }
  }
}
