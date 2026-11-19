// Everything here exists only so saves made under older rules still replay. New games never use it.
// Saves now keep their state (game/server/room.mjs), so a save replays only if it predates that; when every save
// in use has been opened once (which stores its state), this module and the branches it lists can go.
//
// Also legacy, outside this file:
// - check.mjs, resolveTrick: rules.peek === "auto" (Peek replaced the next world card with no choice).
// - check.mjs, peek(): the `swap` field (the old name for `replace`).
// - check.mjs, declareApproach(): `approach` text (approachText) from before goals and approaches merged.
// - server/room.mjs, Room constructor: the replay fallback to rules.peek "auto".
import { rule } from "./campaign.mjs";
import { activeCheck, participant } from "./check.mjs";

// Before the GM's target accepted a goal, the GM approved each approach separately.
export function approveApproach(ctx, { charId, approved = true }) {
  const ck = activeCheck(ctx.state, ["setup"]);
  const p = participant(ck, charId);
  if (!p.approach) throw rule("No approach has been declared.");
  p.approved = !!approved;
  if (!approved) p.approach = null;
  ctx.events.push({ type: approved ? "approachApproved" : "approachRejected", id: charId });
}

export const LEGACY_HANDLERS = { approveApproach };
