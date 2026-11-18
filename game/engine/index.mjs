// The TRICK rules engine: a reducer over plain-data game state.
//   const game = createGame({ seed: "table-1" });
//   const { state, events } = apply(game, { type: "createCharacter", id: "ana", ... });
// apply() never mutates its input unless { inPlace: true } is passed (bots and replays use that for speed).
// An illegal action throws a RuleError whose message can be shown to the player as it is.
import { seedFrom, rngFor } from "./rng.mjs";
import * as campaign from "./campaign.mjs";
import * as check from "./check.mjs";

export { RuleError } from "./campaign.mjs";
export { label, SUITS, SUIT_INFO, STARTER, isStatus, isBlessed, isOrdinary } from "./cards.mjs";
export { CHECK_KINDS, RESULT_RANK, resultFor, compareGoals, legalCards, trickWinner } from "./check.mjs";
export { viewFor } from "./views.mjs";

export const ENGINE_VERSION = 1;

// rules.peek: "choose" (each losing Spade chooses, blind) or "auto" (saves from when Peek always replaced).
export function createGame({ seed = Date.now(), gmSeat = 0, rules = {} } = {}) {
  return {
    version: ENGINE_VERSION,
    rules: { peek: "choose", ...rules },
    seed: String(seed),
    rng: seedFrom(seed),
    characters: {},
    seats: [], // character ids, in join order (display order only)
    gmSeat, // index in seats of the first player listed
    check: null,
    checkCount: 0,
    lastCheckTricks: null,
    history: [],
    actions: [], // every applied action, for replay
  };
}

const HANDLERS = {
  // campaign
  createCharacter: campaign.createCharacter,
  setSeats: (ctx, { seats, gmSeat }) => {
    const st = ctx.state;
    const ids = Object.keys(st.characters);
    if (!Array.isArray(seats) || seats.length !== ids.length || !seats.every((id) => st.characters[id])) {
      throw campaign.rule("List every character once, clockwise.");
    }
    st.seats = [...seats];
    if (gmSeat !== undefined) st.gmSeat = gmSeat;
    ctx.events.push({ type: "seatsSet", seats: st.seats, gmSeat: st.gmSeat });
  },
  gainStatus: campaign.gainStatusBetweenChecks,
  curseViolation: campaign.curseViolation,
  rest: campaign.rest,
  giveItem: campaign.giveItem,
  loseItem: campaign.loseItem,
  useItem: campaign.useItem,
  grantBlessed: campaign.grantBlessed,
  resurrect: campaign.resurrect,
  evolve: (ctx, a) => { campaign.evolve(ctx, a); check.settle(ctx); },
  evolvePick: (ctx, a) => { campaign.evolvePick(ctx, a); check.settle(ctx); },
  // a check
  beginCheck: check.beginCheck,
  setGoal: check.setGoal,
  declareApproach: check.declareApproach,
  approveApproach: check.approveApproach,
  peek: check.peek,
  deal: check.deal,
  lockCard: check.lockCard,
  unlockCard: check.unlockCard,
  recalculate: check.recalculate,
  giveBlessed: check.giveBlessed,
  addConsequence: check.addConsequence,
  endCheck: check.endCheck,
  gmBoost: check.gmBoost,
  gmWorldValue: check.gmWorldValue,
  gmAdjustTally: check.gmAdjustTally,
  gmAdjustTarget: check.gmAdjustTarget,
  gmDraw: (ctx, a) => { check.gmDraw(ctx, a); check.settle(ctx); },
  gmDiscard: check.gmDiscard,
};

export const ACTION_TYPES = Object.keys(HANDLERS);

export function apply(state, action, { inPlace = false } = {}) {
  const handler = HANDLERS[action && action.type];
  if (!handler) throw new campaign.RuleError(`Unknown action "${action && action.type}".`);
  const st = inPlace ? state : structuredClone(state);
  const ctx = { state: st, events: [], rng: rngFor(st) };
  handler(ctx, action);
  st.actions.push(action);
  return { state: st, events: ctx.events };
}

// Rebuild a game from its seed and actions.
export function replay({ seed, gmSeat = 0, rules }, actions) {
  let st = createGame({ seed, gmSeat, rules });
  for (const a of actions) st = apply(st, a, { inPlace: true }).state;
  return st;
}
