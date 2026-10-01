----------------------- MODULE ResearchFixture -----------------------
EXTENDS ResearchSystem
FixtureNext == Begin
  \/ (\E t \in 0..Limit: Keep(t) \/ Discard(t) \/ Cancel(t))
  \/ (\E t \in 0..Limit, value \in -1..1, ok \in BOOLEAN: Measure(t,value,ok))
FixtureSpec == Init /\ [][FixtureNext]_vars
=============================================================================
