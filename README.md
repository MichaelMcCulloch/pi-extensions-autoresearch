# Personal autoresearch (pi 0.99.2)

A measured-experiment ledger and continuation loop, independently loadable from
`src/index.ts` and included in the bundle.

```
autoresearch action=init metric=loss direction=lower decimals=6 maxRuns=50
autoresearch action=run command="bash .auto/measure.sh"
autoresearch action=keep ticket=1 description="baseline"
autoresearch action=start
```

The measurement emits exactly one `METRIC loss=decimal` line. Scores are exact
signed integer units; excess nonzero precision, non-finite values, missing or
duplicate metrics, and unsafe integer magnitudes are refused. Lower objectives
are negated internally so every accepted improvement strictly increases score.

`run` uses `ctx.executeTool('bash', ...)`: normal permission hooks, validation,
abort handling, structured output, nested-call records, and usage accounting apply.
An existing `.auto/checks.sh` runs after a successful measurement; `checks` can
supply another command. The wall-clock deadline covers measurement plus checks.
Truncated or missing structured shell output cannot establish a valid measurement.

`keep` requires a valid, strictly improving measurement (or the first baseline).
`discard` records a rejected measurement. Both require the returned ticket.
`stop` turns off continuation and cancels an outstanding local experiment.
`status` returns the configuration, core and settled history. `init` is once per
session branch; a new session or a branch preceding initialization can establish
a new objective.

**Code integration stays explicit.** Keep/discard records the experimental
decision; it does not commit, reset, or merge files. Use the DAG's existing
worktrees/integration contract to isolate candidates. This is an opinionated
replacement of the measurement/loop contract, not feature parity with the old
extension's dashboards, hooks, or automatic Git operations.

Pi session entries persist the ledger before notifications. Branch switches
invalidate old executions without appending their results to the destination.
Recovery cancels interrupted measurements and pauses automatic continuation.
`start` permits continuation at `agent_before_settle` only after completed activity
when pi allows continuation, and at most once without experimental progress.

`ResearchSystemProof.tla` proves inductive safety for every natural budget and
integer score domain, non-regression of the best score, and validated improvement
before keep. `ResearchFixture` checks 95 states; `ProductionTrace` replays actual
runtime decisions. The comparison theorem proves the reported score relation,
not experimental validity, reproducibility, or the honesty of a script.

Persistence, parser/adapter correctness and host/script behavior are not covered
by a universal implementation refinement theorem. Tests and production-trace
checks are separate evidence, not a ZFC derivation.
