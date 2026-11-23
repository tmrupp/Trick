// Declarative GM Quick-Action Recipes for every catalog item (items/item_catalog.js).
// Every recipe is built purely from the engine's general-purpose primitives — no item-specific engine rules.
// Each recipe returns an array of { label, kind?, disabled?, reason?, run(ev) } buttons for the GM screen.

import { SUITS } from "./client.js";

function cardLabel(c) {
  if (!c) return "";
  if (c.blessed) return "Blessed";
  if (c.status) return SUITS[c.suit].status;
  return `${c.v === 1 ? "A" : c.v} ${SUITS[c.suit].name}`;
}

function unplayedWorld(ck) {
  if (!ck || !ck.worldRow) return [];
  const out = [];
  for (let i = ck.trick; i < ck.worldRow.length; i++) {
    out.push({ index: i, card: ck.worldRow[i] });
  }
  return out;
}

// Queue a status as a consequence during a check (for a participant), or gain it directly between checks.
function giveStatusAction(view, charId, suit, { compulsion = null, send } = {}) {
  const ck = view.check;
  const inCheck = ck && ck.phase !== "closed" && ck.players && ck.players[charId];
  if (inCheck) {
    return send({ type: "addConsequence", charId, suit, ...(compulsion ? { compulsion } : {}) });
  }
  return send({ type: "gainStatus", charId, suit, ...(compulsion ? { compulsion } : {}) });
}

// Ask for a Curse compulsion when the character doesn't have one yet and none is queued.
function ensureCompulsion(view, charId, defaultTerm) {
  const ch = view.characters[charId];
  const ck = view.check;
  const hasOne = (ch && ch.compulsion && ch.compulsion.length > 0)
    || (ck && ck.consequences && ck.consequences.some((c) => c.charId === charId && c.suit === "W" && c.compulsion));
  if (hasOne) return null;
  if (defaultTerm) return defaultTerm;
  const entered = window.prompt("First Curse compulsion (a rule they must obey):", "");
  return entered && entered.trim() ? entered.trim() : null;
}

function activePlayer(view, charId) {
  const ck = view.check;
  if (!ck || ck.phase === "closed" || !ck.players) return null;
  return ck.players[charId] || null;
}

function activePlayPhase(ck) {
  return ck && ["deal", "play", "consolation"].includes(ck.phase);
}

// Build 1-click / 1-picker GM quick actions for a given item instance on charId.
export function itemRecipesFor(inst, ctx) {
  const { view, charId, send, openMenuAt } = ctx;
  const ch = view.characters[charId];
  if (!ch || !inst) return [];
  const ck = view.check;
  const p = activePlayer(view, charId);
  const inPlay = !!(p && activePlayPhase(ck));
  const hand = inPlay && view.hands ? (view.hands[charId] || []) : [];
  const deckCards = ch.deckCards || [];
  const discard = ch.discard || [];
  const reserveCards = ch.reserveCards || [];
  const id = inst.itemId;
  const actions = [];

  const statusBtn = (label, suit, defaultCompulsion = null, kind = "ghost") => ({
    label,
    kind,
    run: () => {
      if (suit === "W") {
        const comp = ensureCompulsion(view, charId, defaultCompulsion);
        const ch0 = view.characters[charId];
        const hasOne = (ch0?.compulsion?.length > 0) || (ck?.consequences?.some((c) => c.charId === charId && c.suit === "W" && c.compulsion));
        if (!hasOne && !comp) return;
        giveStatusAction(view, charId, "W", { compulsion: comp, send });
      } else {
        giveStatusAction(view, charId, suit, { send });
      }
    },
  });

  switch (id) {
    case "black-wedge": {
      const worlds = unplayedWorld(ck);
      actions.push({
        label: "Wedge world card…",
        kind: "primary",
        disabled: !inPlay || !worlds.length,
        reason: "Needs an unplayed world card in a check.",
        run: (ev) => openMenuAt(ev.currentTarget, worlds.map(({ index, card }) => ({
          label: `Trick ${index + 1}: ${cardLabel(card)}${card.worldCannotWin ? " (wedged)" : ""}`,
          onclick: () => send({ type: "gmSetTrickMod", index, worldCannotWin: !card.worldCannotWin, reason: "Black Wedge" }),
        }))),
      });
      const strCards = hand.filter((c) => !c.status && !c.blessed && c.suit === "S");
      const highest = strCards.slice().sort((a, b) => b.v - a.v)[0];
      actions.push({
        label: highest ? `Cost: halve ${cardLabel(highest)} → ${Math.floor(highest.v / 2)}` : "Cost: halve highest Strength",
        disabled: !highest,
        reason: "No ordinary Strength card in hand.",
        run: () => send({ type: "gmCardValue", charId, cardId: highest.id, beat: Math.floor(highest.v / 2), reason: "Black Wedge" }),
      });
      break;
    }

    case "grip-bone": {
      actions.push({
        label: "Carved number → 10…",
        kind: "primary",
        disabled: !p || ck.phase === "resolve",
        reason: "Use during a check.",
        run: (ev) => openMenuAt(ev.currentTarget, [1, 2, 3, 4, 5, 6].map((n) => ({
          label: `${n === 1 ? "A (1)" : n}s count as 10`,
          onclick: () => send({ type: "gmCheckCardRule", charId, kind: "setValue", matchValue: n, to: 10, label: `Grip Bone (${n === 1 ? "A" : n}→10)` }),
        }))),
      });
      actions.push(statusBtn("Cost: +1 Injury", "S"));
      break;
    }

    case "iron-apple-seed": {
      actions.push({
        label: "Next Strength ×2",
        kind: "primary",
        disabled: !p || ck.phase === "resolve",
        reason: "Use during a check.",
        run: () => send({ type: "gmCheckCardRule", charId, kind: "multNext", suit: "S", mult: 2, label: "Iron Apple Seed (next Strength ×2)" }),
      });
      actions.push({
        label: "Cost: +1 Stumble & remove seed",
        kind: "danger",
        run: () => {
          giveStatusAction(view, charId, "D", { send });
          send({ type: "loseItem", charId, instanceId: inst.id, qty: 1 });
        },
      });
      break;
    }

    case "red-thread": {
      actions.push({
        label: "Set card aside…",
        kind: "primary",
        disabled: !inPlay || !hand.length,
        reason: "Needs a card in hand during a check.",
        run: (ev) => openMenuAt(ev.currentTarget, hand.map((c) => ({
          label: cardLabel(c),
          onclick: () => send({ type: "gmSetAside", charId, cardId: c.id, faceUp: true }),
        }))),
      });
      const aside = inPlay ? (p.aside || []) : [];
      actions.push({
        label: aside.length ? `Tug aside card (${aside.length})…` : "Tug aside card…",
        kind: aside.length ? "primary" : "ghost",
        disabled: !inPlay || !aside.length,
        reason: "No card set aside.",
        run: (ev) => openMenuAt(ev.currentTarget, aside.map((a) => {
          const delta = Math.max(0, (ck.trick || 0) - (a.setAtTrick || 0));
          return {
            label: `${cardLabel(a.card)} (+${delta})`,
            onclick: () => send({ type: "gmReturnAside", charId, cardId: a.card.id, to: "hand", beatDelta: delta }),
          };
        })),
      });
      break;
    }

    case "crooked-key": {
      actions.push({
        label: "Take from discard…",
        kind: "primary",
        disabled: !inPlay || !discard.length,
        reason: "Needs a card in discard during a check.",
        run: (ev) => openMenuAt(ev.currentTarget, discard.map((c) => ({
          label: cardLabel(c),
          onclick: () => send({ type: "gmMoveCard", charId, cardId: c.id, to: "hand" }),
        }))),
      });
      actions.push({
        label: "Discard from hand…",
        disabled: !inPlay || !hand.length,
        reason: "Needs a card in hand.",
        run: (ev) => openMenuAt(ev.currentTarget, hand.map((c) => ({
          label: cardLabel(c),
          onclick: () => send({ type: "gmMoveCard", charId, cardId: c.id, to: "discard" }),
        }))),
      });
      actions.push(statusBtn("Cost: +1 Stumble", "D"));
      actions.push(statusBtn("Wrench free: +1 Injury", "S"));
      break;
    }

    case "slate-shard": {
      actions.push({
        label: "Boost next card (+2)",
        kind: "primary",
        disabled: !inPlay,
        reason: "Use during a check.",
        run: () => send({ type: "gmBoost", charId, amount: 2, reason: "Slate Shard" }),
      });
      actions.push(statusBtn("Cost: +1 Stress", "I"));
      break;
    }

    case "ripped-page": {
      actions.push({
        label: "Peek top 3 of deck",
        kind: "primary",
        disabled: !(ch.deckCount > 0),
        reason: "Deck is empty.",
        run: () => send({ type: "gmPeekDeck", charId, n: 3, allowDiscard: true }),
      });
      actions.push(statusBtn("Cost: +1 Stress", "I"));
      break;
    }

    case "whisper-jar": {
      const worlds = unplayedWorld(ck);
      actions.push({
        label: "Silence world card (0)…",
        kind: "primary",
        disabled: !inPlay || !worlds.length,
        reason: "Needs an unplayed world card.",
        run: (ev) => openMenuAt(ev.currentTarget, worlds.map(({ index, card }) => ({
          label: `Trick ${index + 1}: ${cardLabel(card)} → counts as 0`,
          onclick: () => send({ type: "gmWorldValue", index, value: 0, reason: "Whisper Jar" }),
        }))),
      });
      actions.push(statusBtn("Cost: +1 Stress", "I"));
      break;
    }

    case "scoped-rifle": {
      const dexCards = hand.filter((c) => !c.status && !c.blessed && c.suit === "D");
      actions.push({
        label: "Dexterity card +5 (final trick)…",
        kind: "primary",
        disabled: !inPlay || !dexCards.length,
        reason: "No ordinary Dexterity card in hand.",
        run: (ev) => openMenuAt(ev.currentTarget, dexCards.map((c) => ({
          label: `${cardLabel(c)} (+5)`,
          onclick: () => send({ type: "gmCardValue", charId, cardId: c.id, beatDelta: 5, reason: "Scoped Rifle" }),
        }))),
      });
      actions.push(statusBtn("Cost: +1 Stumble", "D"));
      break;
    }

    case "borrowed-face": {
      const worlds = unplayedWorld(ck);
      actions.push({
        label: "Invert world card…",
        kind: "primary",
        disabled: !inPlay || !worlds.length,
        reason: "Needs an unplayed world card.",
        run: (ev) => openMenuAt(ev.currentTarget, worlds.map(({ index, card }) => ({
          label: `Trick ${index + 1}: ${cardLabel(card)}${card.invert ? " (inverted)" : ""}`,
          onclick: () => send({ type: "gmSetTrickMod", index, invert: !card.invert, reason: "Borrowed Face" }),
        }))),
      });
      actions.push(statusBtn("No match: +1 Curse", "W"));
      break;
    }

    case "porters-rope": {
      const allies = inPlay ? (ck.participants || []).filter((cid) => cid !== charId) : [];
      const brace = p ? (p.brace || 0) : 0;
      actions.push({
        label: brace > 0 ? `Give Brace (+${brace}) to ally…` : "Give Brace to ally…",
        kind: "primary",
        disabled: !inPlay || !allies.length || brace <= 0,
        reason: brace <= 0 ? "No Brace held right now." : "No other participants.",
        run: (ev) => openMenuAt(ev.currentTarget, allies.map((aid) => {
          const ally = view.characters[aid];
          const allyBrace = ck.players[aid]?.brace || 0;
          return {
            label: `${ally?.name || aid} (now +${allyBrace} → +${allyBrace + brace})`,
            onclick: () => {
              send({ type: "gmSetConsolation", charId, brace: 0, reason: "Porter's Rope" });
              send({ type: "gmSetConsolation", charId: aid, brace: allyBrace + brace, reason: "Porter's Rope" });
            },
          };
        })),
      });
      break;
    }

    case "still-cricket": {
      actions.push({
        label: "Bottom 1 & draw 1…",
        kind: "primary",
        disabled: !inPlay || !hand.length,
        reason: "Needs a card in hand.",
        run: (ev) => openMenuAt(ev.currentTarget, hand.map((c) => ({
          label: `${cardLabel(c)} → bottom & draw 1`,
          onclick: () => {
            send({ type: "gmMoveCard", charId, cardId: c.id, to: "deck-bottom" });
            send({ type: "gmDraw", charId, n: 1 });
          },
        }))),
      });
      actions.push(statusBtn("Cost: +1 Stumble", "D"));
      break;
    }

    case "afterimage-lens": {
      actions.push({
        label: "Peek top 3 world cards",
        kind: "primary",
        disabled: !inPlay || !(ck.worldDeckCount > 0),
        reason: "Needs an active check with world deck cards.",
        run: () => send({ type: "gmPeekWorld", charId, n: 3 }),
      });
      actions.push({
        label: "Cost: +1 Stress & +1 Curse",
        run: () => {
          const comp = ensureCompulsion(view, charId, "You may not use mirrors");
          giveStatusAction(view, charId, "I", { send });
          giveStatusAction(view, charId, "W", { compulsion: comp, send });
        },
      });
      break;
    }

    case "sin-eaters-spoon": {
      const inCheck = ck && ck.phase !== "closed";
      const others = Object.values(view.characters).filter((o) => o.id !== charId && o.alive && !o.retired);
      const choices = [];
      for (const o of others) {
        for (const c of (o.discard || []).filter((x) => x.status)) {
          choices.push({ ally: o, card: c });
        }
      }
      actions.push({
        label: "Take ally's status…",
        kind: "primary",
        disabled: inCheck || !choices.length,
        reason: inCheck ? "Use between checks." : "No ally has a status in discard.",
        run: (ev) => openMenuAt(ev.currentTarget, choices.map(({ ally, card }) => ({
          label: `${ally.name}'s ${SUITS[card.suit].status}`,
          onclick: () => {
            const comp = card.suit === "W" ? ensureCompulsion(view, charId, null) : null;
            send({ type: "gmMoveCard", charId: ally.id, cardId: card.id, to: "reserve" });
            send({ type: "gainStatus", charId, suit: card.suit, ...(comp ? { compulsion: comp } : {}) });
          },
        }))),
      });
      break;
    }

    // ---- RELICS ----

    case "grave-sledge": {
      const ords = hand.filter((c) => !c.status && !c.blessed);
      const pinned = hand.filter((c) => c.pinned);
      actions.push({
        label: "Pin card in hand…",
        kind: "primary",
        disabled: !inPlay || !ords.length,
        reason: "Needs an ordinary card in hand.",
        run: (ev) => openMenuAt(ev.currentTarget, ords.map((c) => ({
          label: `${cardLabel(c)}${c.pinned ? " (unpin)" : ""}`,
          onclick: () => send({ type: "gmPinCard", charId, cardId: c.id, pinned: !c.pinned }),
        }))),
      });
      actions.push(statusBtn("Price: +1 Injury", "S"));
      const tuckPool = [...hand, ...discard].filter((c) => !c.status && !c.blessed);
      actions.push({
        label: pinned.length ? `Price: tuck ${cardLabel(pinned[0])}` : "Price: tuck card under Sledge…",
        disabled: !(pinned.length || tuckPool.length),
        reason: "No ordinary card available to tuck.",
        run: (ev) => {
          if (pinned.length === 1) {
            send({ type: "gmPinCard", charId, cardId: pinned[0].id, pinned: false });
            send({ type: "gmTuckCard", charId, instanceId: inst.id, cardId: pinned[0].id });
            return;
          }
          openMenuAt(ev.currentTarget, tuckPool.map((c) => ({
            label: cardLabel(c),
            onclick: () => send({ type: "gmTuckCard", charId, instanceId: inst.id, cardId: c.id }),
          })));
        },
      });
      break;
    }

    case "hearthhide-coat": {
      const statuses = hand.filter((c) => c.status);
      const ordDisc = discard.filter((c) => !c.status && !c.blessed);
      actions.push({
        label: statuses.length ? `Set aside ${statuses.length} hand status${statuses.length === 1 ? "" : "es"}` : "Set aside hand statuses",
        kind: "primary",
        disabled: !inPlay || !statuses.length,
        reason: "No statuses in hand.",
        run: () => {
          for (const c of statuses) send({ type: "gmSetAside", charId, cardId: c.id, faceUp: false });
        },
      });
      actions.push({
        label: "Take ordinary from discard…",
        disabled: !inPlay || !ordDisc.length,
        reason: "No ordinary cards in discard.",
        run: (ev) => openMenuAt(ev.currentTarget, ordDisc.map((c) => ({
          label: cardLabel(c),
          onclick: () => send({ type: "gmMoveCard", charId, cardId: c.id, to: "hand" }),
        }))),
      });
      actions.push(statusBtn("Price: +1 Curse", "W", "You may not sleep inside"));
      break;
    }

    case "hushbell-chain": {
      const others = ck && ck.phase === "play"
        ? (ck.participants || []).filter((cid) => cid !== charId && !ck.players[cid]?.sitOut && !ck.players[cid]?.busted && (ck.players[cid]?.handCount > 0))
        : [];
      const rings = inst.charges || 0;
      actions.push({
        label: others.length ? `Random cards for ${others.length} other${others.length === 1 ? "" : "s"}` : "Random cards for others",
        kind: "primary",
        disabled: !others.length,
        reason: "Ring it during a trick: nobody else can play right now.",
        run: () => {
          send({ type: "gmLockRandom", charIds: others, reason: "Hushbell Chain" });
          send({ type: "updateItem", charId, instanceId: inst.id, charges: rings + 1 });
        },
      });
      actions.push({
        // Price: one Stumble for each time it rang; none if it never rang.
        label: `Price: +${rings} Stumble${rings === 1 ? "" : "s"} & reset`,
        disabled: !rings,
        reason: "It hasn't rung yet.",
        run: () => {
          for (let i = 0; i < rings; i++) giveStatusAction(view, charId, "D", { send });
          send({ type: "updateItem", charId, instanceId: inst.id, charges: 0 });
        },
      });
      break;
    }

    case "dead-ledger": {
      const stressDeck = deckCards.filter((c) => c.status && c.suit === "I");
      const stressDisc = discard.filter((c) => c.status && c.suit === "I");
      const total = stressDeck.length + stressDisc.length;
      actions.push({
        label: total ? `Pull all ${total} Stress to hand & shuffle` : "Pull all Stress to hand",
        kind: "primary",
        disabled: !inPlay || !total,
        reason: "No Stress in deck or discard.",
        run: () => {
          for (const c of [...stressDeck, ...stressDisc]) send({ type: "gmMoveCard", charId, cardId: c.id, to: "hand" });
          send({ type: "gmShuffleDeck", charId });
        },
      });
      actions.push(statusBtn("Price: +1 Injury", "S"));
      break;
    }

    case "wake-lantern": {
      const resOrds = reserveCards.filter((c) => !c.status && !c.blessed);
      actions.push({
        label: "Price: copy card from reserve…",
        disabled: !resOrds.length,
        reason: "No ordinary cards in reserve.",
        run: (ev) => openMenuAt(ev.currentTarget, resOrds.map((c) => ({
          label: cardLabel(c),
          onclick: () => send({ type: "gmMoveCard", charId, cardId: c.id, to: "discard" }),
        }))),
      });
      actions.push({
        label: "Price: +1 status…",
        run: (ev) => openMenuAt(ev.currentTarget, ["S", "D", "I", "W"].map((s) => ({
          label: SUITS[s].status,
          onclick: () => {
            const comp = s === "W" ? ensureCompulsion(view, charId, null) : null;
            giveStatusAction(view, charId, s, { compulsion: comp, send });
          },
        }))),
      });
      break;
    }

    case "halved-locket": {
      const inCheck = ck && ck.phase !== "closed";
      const others = Object.values(view.characters).filter((o) => o.id !== charId && o.alive && !o.retired);
      const exch = inst.charges || 0;
      actions.push({
        label: "Swap card pools with…",
        kind: "primary",
        disabled: inCheck || !others.length,
        reason: inCheck ? "Swap pools between checks." : "No other active character.",
        run: (ev) => openMenuAt(ev.currentTarget, others.map((o) => ({
          label: `Swap pools with ${o.name}`,
          onclick: () => {
            send({ type: "gmSwapPools", charA: charId, charB: o.id });
            send({ type: "updateItem", charId, instanceId: inst.id, charges: exch + 1 });
          },
        }))),
      });
      actions.push({
        label: `Price: +${Math.max(1, exch)} Stress to both…`,
        disabled: !others.length,
        reason: "No other active character.",
        run: (ev) => openMenuAt(ev.currentTarget, others.map((o) => ({
          label: `${ch.name} & ${o.name} (+${Math.max(1, exch)} Stress each)`,
          onclick: () => {
            const n = Math.max(1, exch);
            for (let i = 0; i < n; i++) {
              giveStatusAction(view, charId, "I", { send });
              giveStatusAction(view, o.id, "I", { send });
            }
          },
        }))),
      });
      break;
    }

    case "hollow-blindfold": {
      const delta = p ? (p.target || 0) - (p.total || 0) : 0;
      actions.push({
        label: p ? `Land on target (${p.target}) & sit out` : "Land on target & sit out",
        kind: "primary",
        disabled: !inPlay,
        reason: "Use during a check.",
        run: () => {
          if (delta !== 0) send({ type: "gmAdjustTally", charId, delta, reason: "Hollow Blindfold" });
          send({ type: "gmSitOut", charId, sitOut: true, reason: "Hollow Blindfold" });
        },
      });
      actions.push({
        label: "Price: +2 Injuries",
        run: () => {
          giveStatusAction(view, charId, "S", { send });
          giveStatusAction(view, charId, "S", { send });
        },
      });
      break;
    }

    case "dying-ring": {
      const charges = inst.charges || 0;
      actions.push({
        label: "+1 Charge",
        run: () => send({ type: "updateItem", charId, instanceId: inst.id, charges: charges + 1 }),
      });
      const pullable = inPlay ? [...deckCards, ...discard] : [];
      actions.push({
        label: `Spend charge: take deck & discard (${pullable.length})`,
        kind: "primary",
        disabled: !inPlay || !pullable.length,
        reason: !inPlay ? "Use after the deal in a check." : "Deck and discard are empty.",
        run: () => {
          if (charges > 0) send({ type: "updateItem", charId, instanceId: inst.id, charges: charges - 1 });
          for (const c of pullable) send({ type: "gmMoveCard", charId, cardId: c.id, to: "hand" });
        },
      });
      actions.push({
        label: "Price: +3 Injuries",
        kind: "danger",
        run: () => {
          for (let i = 0; i < 3; i++) giveStatusAction(view, charId, "S", { send });
        },
      });
      break;
    }

    case "iron-apple": {
      actions.push({
        label: "Strength < 5 counts 5",
        kind: "primary",
        disabled: !p || ck.phase === "resolve",
        reason: "Use during a check.",
        run: () => send({ type: "gmCheckCardRule", charId, kind: "minValue", suit: "S", min: 5, ordinaryOnly: true, label: "Iron Apple (Strength min 5)" }),
      });
      actions.push({
        label: "Price: 3 statuses + 4 Seeds & remove",
        kind: "danger",
        run: () => {
          giveStatusAction(view, charId, "S", { send });
          giveStatusAction(view, charId, "D", { send });
          giveStatusAction(view, charId, "I", { send });
          send({ type: "giveItem", charId, itemId: "iron-apple-seed", qty: 4, stack: true });
          send({ type: "loseItem", charId, instanceId: inst.id, qty: 1 });
        },
      });
      break;
    }
  }

  return actions;
}
