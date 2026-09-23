1. Correctness — the game currently trusts the LM blindly

None of this is enforced in code; the model could claim anything and we'd apply it.

Side ownership check: applyMoveActions never verifies a moved/attacking piece actually belongs to aiSide. Add that check.

Movement legality: a Move is only checked for "is the target area a real area" — not connectivity, distance vs. the piece's m stat, or swamp/terrain penalties from the rules. Right now the model could teleport a piece anywhere on the board.

Combat resolution: Attack results (eliminated/damaged/retreat) are taken entirely on the model's word — the a/d/terrain formula in the rules is never actually computed by us. Either compute it server-side and ignore the model's claimed outcome, or at least sanity-check it and flag implausible results.

Win/loss detection: rules 10–11 ("no pieces left" / "all City areas controlled") are never checked — the game has no way to actually end.

2. Reliability — the current default is very slow

Decide on think: it's currently true in main.cjs, meaning every move costs ~6 minutes (confirmed by testing last turn). Either commit to that, or build the fuzzy-match + auto-retry safety net discussed earlier so think:false (~30s) becomes safe to use again — catching near-miss typos like "Emerfall" cheaply instead of paying 12x the latency to avoid them.

Turn tracking: there's no concept of whose turn it is. Rule 1 says "starting with Alliance," but nothing stops "Make AI move" from running repeatedly regardless of turn order, or accounts for a human player's moves.

3. Visibility — hard to trust what you can't see

Visual board: Game State is still a plain text list. Even a simple grid/graph rendering of areas + piece positions would make it far easier to sanity-check the AI's moves against the actual board shape.

Legacy game cleanup: old game records from before sides/rules existed are still sitting in games.json with no migration path or delete-from-UI warning about incompatibility.

4. Engineering hygiene

Automated tests: every parser/logic module (gameSpec, piecesSpec, rulesSpec, moveResponse, movePrompt) has been verified with one-off Node scripts each session, nothing persisted. Worth adding vitest and turning those into a real suite so regressions get caught automatically.

Packaging: electron-builder warned about missing description/author in package.json; a fresh production build (npm run electron:build) hasn't been re-tested since the recent UI restructuring.
