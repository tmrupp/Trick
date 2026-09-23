(function () {
  const KIND_LABELS = { trinket: "Trinket", relic: "Relic", reveal: "Price" };
  const SLOT_PATTERN = /^(Wake|When|Effect|Cost|Price):\s*(.*)$/;
  const REVEAL_LINE = "Reveal its price.";

  const icon = globalThis.TrickSuitIcons.svg;

  // Split catalog lines into the card's parts. An italic line before any slot is the Form;
  // italic lines after it are Marks; an unlabelled plain line continues the slot above it.
  function parseLines(lines, kind) {
    const parts = { form: "", slots: [], marks: [], reveal: false };
    for (const line of lines) {
      if (line === REVEAL_LINE) {
        parts.reveal = true;
        continue;
      }
      const slot = line.match(SLOT_PATTERN);
      if (slot) {
        parts.slots.push({ label: slot[1], paragraphs: [slot[2]] });
      } else if (line.startsWith("<em>")) {
        const text = line.replace(/^<em>|<\/em>$/g, "");
        if (kind !== "reveal" && !parts.form && parts.slots.length === 0) {
          parts.form = text;
        } else {
          parts.marks.push(text);
        }
      } else if (parts.slots.length > 0) {
        parts.slots[parts.slots.length - 1].paragraphs.push(line);
      } else {
        throw new Error(`Unplaced item line: ${line}`);
      }
    }
    return parts;
  }

  const requestedId = new URLSearchParams(window.location.search).get("id") || "black-wedge";
  const card = window.TrickItemCatalog.getItemCardById(requestedId);
  if (!card) {
    throw new Error(`Unknown item card id: ${requestedId}`);
  }

  if (new URLSearchParams(window.location.search).get("export") === "1") {
    document.body.classList.add("export-page");
  }

  const suit = globalThis.TrickSuitIcons.suits[card.suit];
  const root = document.getElementById("card-root");
  root.classList.add(`item-${card.kind}-card`);
  root.style.setProperty("--suit-ink", suit.ink);

  const parts = parseLines(card.lines, card.kind);
  const name = card.kind === "reveal" ? card.label.replace(/ Price$/, "") : card.label;
  const kindIcon = card.kind === "trinket" ? "trinket" : "relic";

  const slots = parts.slots.map((slot) => `
    <div class="item-slot-label item-slot--${slot.label.toLowerCase()}">${slot.label}</div>
    <div class="item-slot-text item-slot--${slot.label.toLowerCase()}">${slot.paragraphs.map((text) => `<p>${text}</p>`).join("")}</div>`).join("");

  document.getElementById("rules-text").innerHTML = `
    <header class="item-head">
      <div class="item-eyebrow">
        <span class="item-kind">${icon(kindIcon)}${KIND_LABELS[card.kind]}</span>
        ${icon(card.suit, suit.name)}
      </div>
      <h1 class="item-title">${name}</h1>
    </header>
    ${parts.form ? `<p class="item-form">${parts.form}</p>` : ""}
    <div class="item-slots">${slots}</div>
    ${parts.marks.length ? `<div class="item-marks">${parts.marks.map((text) => `<p class="item-mark">${text}</p>`).join("")}</div>` : ""}
    ${parts.reveal ? `<div class="item-tab">Reveal its price</div>` : ""}`;

  document.title = card.label;
}());
