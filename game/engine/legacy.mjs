// Everything here exists only so saves made under older rules still replay. New games never use it.
// Saves now keep their state (game/server/room.mjs), so a save replays only if it predates that; when every save
// in use has been opened once (which stores its state), this module and the branches it lists can go.
//
// Also legacy, outside this file:
// - check.mjs: games without rules.consolations 2 (consolationsV2) keep Peek (legacyPeek, peek()) and the choosing
//   Recalculate (recalculate(), the "recalculate" prompt); bot.mjs answers those prompts; the pages show them.
// - check.mjs: games without rules.stumble "deck" (stumblePrice) keep Stumble's Price: lockCard's priceCardId, the
//   "pricePaid" event, and played Stumbles going to discard at cleanup; bot.mjs picks a price; the hand dock asks for one.
// - check.mjs: games without rules.world "lose" (worldConsoles) give the world no consolation.
// - check.mjs: games without rules.bustSitOut (bustSitOut) let busted players keep playing remaining tricks.
// - campaign.mjs: games without rules.survival "3m+3" (survivalTarget) set survival target to 3 × M instead of 3 × M + 3.
// - shared/client.js, trickSentence(): a trick log entry whose world field holds the world's consolation record (saves
//   from before it moved to worldConsolation, when it overwrote the world card id).
// - campaign.mjs, item actions (via findItem and giveItem) and views.mjs: ch.items holding bare catalog ids, from
//   before item instances; upgradeItems and legacyItem below. loseItem, updateItem, useItem and the rest still accept
//   itemId in place of instanceId, so older saves' item actions replay.
// - server/room.mjs and store.mjs: a save naming no rules replays under { peek: "choose" }.
// - check.mjs, legacyPeek: rules.peek === "auto" (Peek replaced the next world card with no choice).
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

// Before item instances, ch.items held bare catalog ids ("black-wedge"). Read one as an instance.
export const legacyItem = (it) => (typeof it === "string"
  ? { id: it, itemId: it, label: null, text: null, qty: 1, charges: 0, revealed: false, note: "", tucked: [] }
  : it);

// An item action on such a character first turns its ids into instances, so it can find, count and change them.
export function upgradeItems(ch) {
  if (!(ch.items || []).some((x) => typeof x === "string")) return;
  ch.items = ch.items.map((x) => {
    if (typeof x !== "string") return x;
    ch.itemSeq = (ch.itemSeq || 0) + 1;
    return { ...legacyItem(x), id: `it-${ch.itemSeq}` };
  });
}
