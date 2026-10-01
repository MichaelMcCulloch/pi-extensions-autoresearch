---------------- MODULE ProductionTrace ----------------
EXTENDS ResearchSystem, Sequences
VARIABLE cursor
Expected == <<
  [phase |-> "idle", next |-> 0, settled |-> 0, kept |-> 0, best |-> None, score |-> None, valid |-> FALSE],
  [phase |-> "running", next |-> 1, settled |-> 0, kept |-> 0, best |-> None, score |-> None, valid |-> FALSE],
  [phase |-> "measured", next |-> 1, settled |-> 0, kept |-> 0, best |-> None, score |-> 1, valid |-> TRUE],
  [phase |-> "idle", next |-> 1, settled |-> 1, kept |-> 1, best |-> 1, score |-> None, valid |-> FALSE],
  [phase |-> "running", next |-> 2, settled |-> 1, kept |-> 1, best |-> 1, score |-> None, valid |-> FALSE],
  [phase |-> "measured", next |-> 2, settled |-> 1, kept |-> 1, best |-> 1, score |-> 0, valid |-> TRUE],
  [phase |-> "idle", next |-> 2, settled |-> 2, kept |-> 1, best |-> 1, score |-> None, valid |-> FALSE],
  [phase |-> "running", next |-> 3, settled |-> 2, kept |-> 1, best |-> 1, score |-> None, valid |-> FALSE],
  [phase |-> "measured", next |-> 3, settled |-> 2, kept |-> 1, best |-> 1, score |-> 2, valid |-> TRUE],
  [phase |-> "idle", next |-> 3, settled |-> 3, kept |-> 2, best |-> 2, score |-> None, valid |-> FALSE],
  [phase |-> "running", next |-> 4, settled |-> 3, kept |-> 2, best |-> 2, score |-> None, valid |-> FALSE],
  [phase |-> "measured", next |-> 4, settled |-> 3, kept |-> 2, best |-> 2, score |-> 0, valid |-> FALSE],
  [phase |-> "idle", next |-> 4, settled |-> 4, kept |-> 2, best |-> 2, score |-> None, valid |-> FALSE]
>>
TraceInit == Init /\ cursor = 1
TraceNext ==
  \/ (cursor = 1 /\ (Begin) /\ cursor' = 2)
  \/ (cursor = 2 /\ (Measure(1,1,TRUE)) /\ cursor' = 3)
  \/ (cursor = 3 /\ (Keep(1)) /\ cursor' = 4)
  \/ (cursor = 4 /\ (Begin) /\ cursor' = 5)
  \/ (cursor = 5 /\ (Measure(2,0,TRUE)) /\ cursor' = 6)
  \/ (cursor = 6 /\ (Discard(2)) /\ cursor' = 7)
  \/ (cursor = 7 /\ (Begin) /\ cursor' = 8)
  \/ (cursor = 8 /\ (Measure(3,2,TRUE)) /\ cursor' = 9)
  \/ (cursor = 9 /\ (Keep(3)) /\ cursor' = 10)
  \/ (cursor = 10 /\ (Begin) /\ cursor' = 11)
  \/ (cursor = 11 /\ (Measure(4,0,FALSE)) /\ cursor' = 12)
  \/ (cursor = 12 /\ (Discard(4)) /\ cursor' = 13)
TraceSpec == TraceInit /\ [][TraceNext]_<<vars,cursor>>
Matches == /\ Inv
           /\ phase = Expected[cursor].phase
           /\ next = Expected[cursor].next
           /\ settled = Expected[cursor].settled
           /\ kept = Expected[cursor].kept
           /\ best = Expected[cursor].best
           /\ score = Expected[cursor].score
           /\ valid = Expected[cursor].valid
=============================================================================
