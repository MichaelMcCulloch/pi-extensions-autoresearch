------------------------- MODULE ResearchSystem -------------------------
EXTENDS Integers
CONSTANTS Limit, None
VARIABLES phase, next, settled, kept, best, score, valid
vars == <<phase, next, settled, kept, best, score, valid>>
Init == /\ phase = "idle" /\ next = 0 /\ settled = 0 /\ kept = 0
        /\ best = None /\ score = None /\ valid = FALSE
Begin == /\ phase = "idle" /\ next < Limit /\ phase' = "running"
         /\ next' = next + 1 /\ score' = None /\ valid' = FALSE
         /\ UNCHANGED <<settled, kept, best>>
Measure(t, value, ok) ==
  /\ phase = "running" /\ t = next /\ value \in Int /\ ok \in BOOLEAN
  /\ phase' = "measured" /\ score' = value /\ valid' = ok
  /\ UNCHANGED <<next, settled, kept, best>>
Keep(t) == /\ phase = "measured" /\ t = next /\ valid
           /\ (IF best = None THEN TRUE ELSE score > best)
           /\ phase' = "idle" /\ settled' = settled + 1 /\ kept' = kept + 1
           /\ best' = score /\ score' = None /\ valid' = FALSE /\ UNCHANGED next
Discard(t) == /\ phase = "measured" /\ t = next
              /\ phase' = "idle" /\ settled' = settled + 1
              /\ score' = None /\ valid' = FALSE /\ UNCHANGED <<next, kept, best>>
Cancel(t) == /\ phase # "idle" /\ t = next
             /\ phase' = "idle" /\ settled' = settled + 1
             /\ score' = None /\ valid' = FALSE /\ UNCHANGED <<next, kept, best>>
Next == Begin \/ (\E t \in Nat: Keep(t) \/ Discard(t) \/ Cancel(t))
        \/ (\E t \in Nat, value \in Int, ok \in BOOLEAN: Measure(t, value, ok))
TypeOK == /\ phase \in {"idle", "running", "measured"}
          /\ next \in 0..Limit /\ settled \in 0..Limit /\ kept \in 0..Limit
          /\ best \in Int \cup {None} /\ score \in Int \cup {None} /\ valid \in BOOLEAN
Conservation == next = settled + IF phase = "idle" THEN 0 ELSE 1
KeptBound == kept <= settled
BestSound == (best = None) <=> (kept = 0)
Measurement == IF phase = "measured" THEN score \in Int ELSE score = None /\ ~valid
Inv == TypeOK /\ Conservation /\ KeptBound /\ BestSound /\ Measurement
Spec == Init /\ [][Next]_vars
=============================================================================
