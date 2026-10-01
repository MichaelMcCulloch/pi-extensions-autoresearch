import { StringEnum, type JsonValue } from '@earendil-works/pi-ai';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import { ResearchRuntime, type Config, type Snapshot } from './runtime.ts';

const ENTRY = 'autoresearch/state';
const Params = Type.Object({
  action: StringEnum(['init', 'run', 'keep', 'discard', 'status', 'start', 'stop'] as const),
  metric: Type.Optional(Type.String()), direction: Type.Optional(Type.Union([Type.Literal('higher'), Type.Literal('lower')])),
  decimals: Type.Optional(Type.Integer({ minimum: 0, maximum: 9 })), maxRuns: Type.Optional(Type.Integer({ minimum: 1 })),
  command: Type.Optional(Type.String()), checks: Type.Optional(Type.String()),
  timeoutMs: Type.Optional(Type.Integer({ minimum: 1, maximum: 2_147_483_647 })),
  ticket: Type.Optional(Type.Integer({ minimum: 1 })), description: Type.Optional(Type.String()),
});
export default function autoresearchExtension(pi: ExtensionAPI): void {
  let runtime: ResearchRuntime | undefined;
  const create = (config: Config, snapshot?: Snapshot): ResearchRuntime => new ResearchRuntime({
    save: state => pi.appendEntry(ENTRY, state),
    changed: (state, event) => pi.events.emit('autoresearch/changed', { state, event }),
    exec: async () => { throw new Error('autoresearch-tool-context-required'); },
  }, config, snapshot);
  const load = (ctx: ExtensionContext): void => {
    runtime?.close(); runtime = undefined;
    let snapshot: Snapshot | undefined;
    for (const entry of ctx.sessionManager.getBranch()) if (entry.type === 'custom' && entry.customType === ENTRY) snapshot = entry.data as Snapshot;
    if (snapshot) { runtime = create(snapshot.config, snapshot); runtime.recover(); }
  };
  pi.on('session_start', (_event, ctx) => load(ctx));
  pi.on('session_tree', (_event, ctx) => load(ctx));
  pi.on('session_shutdown', () => { runtime?.close(); runtime = undefined; });
  pi.on('agent_before_settle', event => {
    if (event.outcome !== 'completed' || !event.context.canContinue || !runtime?.takeContinuation()) return;
    return { continue: true, entries: [{ type: 'custom_message' as const, customType: 'autoresearch/continue', content: 'Continue the experiment loop. Read autoresearch status and .auto/prompt.md. Form a hypothesis, edit a candidate, run its measurement and checks, then keep only a valid improvement or discard it. Use DAG/worktree tools for code isolation and integration; keep/discard records the measurement decision and does not change Git. Stop when the goal or run budget is reached.', display: true }] };
  });
  pi.registerTool({ name: 'autoresearch', label: 'Autoresearch', namespace: { name: 'research', description: 'Measured experiments and optimization history' }, outputSchema: Type.Object({ result: Type.Unknown() }), description: 'Run measured optimization experiments. init configures a metric, exact decimal precision, direction and run budget. run executes a command emitting METRIC name=value and optional checks. keep accepts only a valid improvement; discard settles other results. These decisions record measurements; use DAG/worktrees for Git changes. start enables follow-up turns; stop cancels the active run.', parameters: Params,
    async execute(_id, p, signal, _update, ctx) {
      if (p.action === 'init') {
        if (runtime) throw new Error('autoresearch-already-initialized');
        if (!p.metric) throw new Error('autoresearch-metric-required');
        runtime = create({ metric: p.metric, direction: p.direction ?? 'lower', decimals: p.decimals ?? 6, maxRuns: p.maxRuns ?? 50 });
        runtime.activate(false);
      }
      if (!runtime) throw new Error('autoresearch-init-required');
      let result: unknown;
      switch (p.action) {
        case 'run': result = await runtime.run(p.command ?? 'bash .auto/measure.sh', p.checks ?? (existsSync(join(ctx.cwd, '.auto/checks.sh')) ? 'bash .auto/checks.sh' : undefined), ctx.cwd, p.timeoutMs ?? 300_000, signal, async (command, _cwd, timeout, nestedSignal) => {
          const outcome = await ctx.executeTool('bash', { command, timeout: Math.ceil(timeout / 1000) }, { signal: nestedSignal });
          const data = outcome.result.structuredContent as { output?: unknown; exit_code?: unknown; truncated?: unknown } | undefined;
          if (!data || typeof data.output !== 'string' || typeof data.exit_code !== 'number' || data.truncated !== false) throw new Error('autoresearch-incomplete-shell-result');
          return { stdout: data.output, stderr: '', code: outcome.isError ? 1 : data.exit_code, killed: nestedSignal.aborted };
        }); break;
        case 'keep': case 'discard':
          if (!p.ticket) throw new Error('autoresearch-ticket-required');
          runtime.decide(p.action === 'keep', p.ticket, p.description ?? ''); break;
        case 'start': runtime.activate(true); break;
        case 'stop': runtime.activate(false); runtime.cancel(); break;
      }
      result ??= runtime.snapshot;
      return { content: [{ type: 'text', text: JSON.stringify(result) }], details: {}, structuredContent: { result: JSON.parse(JSON.stringify(result)) as JsonValue } };
    },
  });
}
