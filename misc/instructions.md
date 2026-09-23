When it is your turn, respond with ONLY a list of actions, one per line. Do not include any commentary, explanation, or extra text outside these lines — your reasoning should happen in your own thinking, not in the response itself.

Each line describes one action taken by one of your pieces, using one of the exact formats below. A single piece may appear on more than one line if it takes more than one action this turn (for example, moving and then attacking), as allowed by the game's rules.

Move:
PieceId - Move: FromAreaId-ToAreaId

Attack:
PieceId - Attack: TargetAreaId Result: ResultPieceId-Status

Status must be exactly one of: damaged, retreat, eliminated

ResultPieceId is the id of whichever piece ends up in that status as a result of the battle — this may be the defending piece or the attacking piece itself, depending on the outcome.

Only use the action types, turn order, and phase structure defined in the game's rules. The rules decide what actions are available, in what order, and under what conditions. This document only defines how to format your response once you have decided what to do — it does not grant permission to take an action the rules do not allow.

Example response:

P3 - Move: Duskwood-Ravenspire
P3 - Attack: Shadowfen Result: P10-eliminated
P7 - Attack: Mirewatch Result: P7-retreat
