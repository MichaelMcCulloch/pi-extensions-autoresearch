---------------- MODULE ResearchSystemProof ----------------
EXTENDS ResearchSystem, TLAPS
THEOREM InitInv == ASSUME Limit \in Nat, None \notin Int PROVE Init => Inv
  BY SMT DEF Init, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
THEOREM Step0 == ASSUME Limit \in Nat, None \notin Int PROVE Inv /\ (Begin) => Inv'
  <1>1. Inv /\ (Begin) => TypeOK'
    BY SMT DEF Begin, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>2. Inv /\ (Begin) => Conservation'
    BY SMT DEF Begin, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>3. Inv /\ (Begin) => KeptBound'
    BY SMT DEF Begin, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>4. Inv /\ (Begin) => BestSound'
    BY SMT DEF Begin, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>5. Inv /\ (Begin) => Measurement'
    BY SMT DEF Begin, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>6. QED BY <1>1, <1>2, <1>3, <1>4, <1>5 DEF Inv
THEOREM Step1 == ASSUME Limit \in Nat, None \notin Int PROVE Inv /\ (\E t \in Nat, v \in Int, ok \in BOOLEAN: Measure(t,v,ok)) => Inv'
  <1>1. Inv /\ (\E t \in Nat, v \in Int, ok \in BOOLEAN: Measure(t,v,ok)) => TypeOK'
    BY SMT DEF Measure, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>2. Inv /\ (\E t \in Nat, v \in Int, ok \in BOOLEAN: Measure(t,v,ok)) => Conservation'
    BY SMT DEF Measure, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>3. Inv /\ (\E t \in Nat, v \in Int, ok \in BOOLEAN: Measure(t,v,ok)) => KeptBound'
    BY SMT DEF Measure, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>4. Inv /\ (\E t \in Nat, v \in Int, ok \in BOOLEAN: Measure(t,v,ok)) => BestSound'
    BY SMT DEF Measure, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>5. Inv /\ (\E t \in Nat, v \in Int, ok \in BOOLEAN: Measure(t,v,ok)) => Measurement'
    BY SMT DEF Measure, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>6. QED BY <1>1, <1>2, <1>3, <1>4, <1>5 DEF Inv
THEOREM Step2 == ASSUME Limit \in Nat, None \notin Int PROVE Inv /\ (\E t \in Nat: Keep(t)) => Inv'
  <1>1. Inv /\ (\E t \in Nat: Keep(t)) => TypeOK'
    BY SMT DEF Keep, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>2. Inv /\ (\E t \in Nat: Keep(t)) => Conservation'
    BY SMT DEF Keep, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>3. Inv /\ (\E t \in Nat: Keep(t)) => KeptBound'
    BY SMT DEF Keep, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>4. Inv /\ (\E t \in Nat: Keep(t)) => BestSound'
    BY SMT DEF Keep, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>5. Inv /\ (\E t \in Nat: Keep(t)) => Measurement'
    BY SMT DEF Keep, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>6. QED BY <1>1, <1>2, <1>3, <1>4, <1>5 DEF Inv
THEOREM Step3 == ASSUME Limit \in Nat, None \notin Int PROVE Inv /\ (\E t \in Nat: Discard(t)) => Inv'
  <1>1. Inv /\ (\E t \in Nat: Discard(t)) => TypeOK'
    BY SMT DEF Discard, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>2. Inv /\ (\E t \in Nat: Discard(t)) => Conservation'
    BY SMT DEF Discard, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>3. Inv /\ (\E t \in Nat: Discard(t)) => KeptBound'
    BY SMT DEF Discard, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>4. Inv /\ (\E t \in Nat: Discard(t)) => BestSound'
    BY SMT DEF Discard, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>5. Inv /\ (\E t \in Nat: Discard(t)) => Measurement'
    BY SMT DEF Discard, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>6. QED BY <1>1, <1>2, <1>3, <1>4, <1>5 DEF Inv
THEOREM Step4 == ASSUME Limit \in Nat, None \notin Int PROVE Inv /\ (\E t \in Nat: Cancel(t)) => Inv'
  <1>1. Inv /\ (\E t \in Nat: Cancel(t)) => TypeOK'
    BY SMT DEF Cancel, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>2. Inv /\ (\E t \in Nat: Cancel(t)) => Conservation'
    BY SMT DEF Cancel, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>3. Inv /\ (\E t \in Nat: Cancel(t)) => KeptBound'
    BY SMT DEF Cancel, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>4. Inv /\ (\E t \in Nat: Cancel(t)) => BestSound'
    BY SMT DEF Cancel, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>5. Inv /\ (\E t \in Nat: Cancel(t)) => Measurement'
    BY SMT DEF Cancel, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>6. QED BY <1>1, <1>2, <1>3, <1>4, <1>5 DEF Inv
THEOREM Step5 == ASSUME Limit \in Nat, None \notin Int PROVE Inv /\ (UNCHANGED vars) => Inv'
  <1>1. Inv /\ (UNCHANGED vars) => TypeOK'
    BY SMT DEF vars, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>2. Inv /\ (UNCHANGED vars) => Conservation'
    BY SMT DEF vars, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>3. Inv /\ (UNCHANGED vars) => KeptBound'
    BY SMT DEF vars, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>4. Inv /\ (UNCHANGED vars) => BestSound'
    BY SMT DEF vars, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>5. Inv /\ (UNCHANGED vars) => Measurement'
    BY SMT DEF vars, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>6. QED BY <1>1, <1>2, <1>3, <1>4, <1>5 DEF Inv
THEOREM StepInv == ASSUME Limit \in Nat, None \notin Int PROVE Inv /\ [Next]_vars => Inv'
  BY SMT, Step0, Step1, Step2, Step3, Step4, Step5 DEF Next
THEOREM Safety == ASSUME Limit \in Nat, None \notin Int PROVE Spec => []Inv
  BY InitInv, StepInv, PTL DEF Spec
THEOREM BestNeverRegresses ==
  ASSUME Limit \in Nat, None \notin Int
  PROVE Inv /\ [Next]_vars /\ best # None => best' # None /\ best' >= best
  <1>1. Inv /\ (Begin) /\ best # None => best' # None /\ best' >= best
    BY SMT DEF Begin, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>2. Inv /\ (\E t \in Nat, v \in Int, ok \in BOOLEAN: Measure(t,v,ok)) /\ best # None => best' # None /\ best' >= best
    BY SMT DEF Measure, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>3. Inv /\ (\E t \in Nat: Keep(t)) /\ best # None => best' # None /\ best' >= best
    BY SMT DEF Keep, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>4. Inv /\ (\E t \in Nat: Discard(t)) /\ best # None => best' # None /\ best' >= best
    BY SMT DEF Discard, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>5. Inv /\ (\E t \in Nat: Cancel(t)) /\ best # None => best' # None /\ best' >= best
    BY SMT DEF Cancel, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>6. Inv /\ (UNCHANGED vars) /\ best # None => best' # None /\ best' >= best
    BY SMT DEF vars, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>7. QED BY SMT, <1>1, <1>2, <1>3, <1>4, <1>5, <1>6 DEF Next
THEOREM KeepRequiresValidatedImprovement ==
  ASSUME Limit \in Nat, None \notin Int
  PROVE Inv /\ [Next]_vars /\ kept' > kept => valid /\ phase = "measured" /\ (IF best = None THEN TRUE ELSE score > best)
  <1>1. Inv /\ (Begin) /\ kept' > kept => valid /\ phase = "measured" /\ (IF best = None THEN TRUE ELSE score > best)
    BY SMT DEF Begin, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>2. Inv /\ (\E t \in Nat, v \in Int, ok \in BOOLEAN: Measure(t,v,ok)) /\ kept' > kept => valid /\ phase = "measured" /\ (IF best = None THEN TRUE ELSE score > best)
    BY SMT DEF Measure, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>3. Inv /\ (\E t \in Nat: Keep(t)) /\ kept' > kept => valid /\ phase = "measured" /\ (IF best = None THEN TRUE ELSE score > best)
    BY SMT DEF Keep, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>4. Inv /\ (\E t \in Nat: Discard(t)) /\ kept' > kept => valid /\ phase = "measured" /\ (IF best = None THEN TRUE ELSE score > best)
    BY SMT DEF Discard, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>5. Inv /\ (\E t \in Nat: Cancel(t)) /\ kept' > kept => valid /\ phase = "measured" /\ (IF best = None THEN TRUE ELSE score > best)
    BY SMT DEF Cancel, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>6. Inv /\ (UNCHANGED vars) /\ kept' > kept => valid /\ phase = "measured" /\ (IF best = None THEN TRUE ELSE score > best)
    BY SMT DEF vars, Inv, TypeOK, Conservation, KeptBound, BestSound, Measurement
  <1>7. QED BY SMT, <1>1, <1>2, <1>3, <1>4, <1>5, <1>6 DEF Next
=============================================================================
