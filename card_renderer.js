(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const config = typeof CARD_VARIANT_CONFIG !== "undefined"
    ? CARD_VARIANT_CONFIG
    : (window.CARD_VARIANT_CONFIG || {});

  const suitSvgPath = urlParams.get("suitSvgPath") || config.suitSvgPath || "";
  const suitLabel = urlParams.get("suitLabel") || config.suitLabel || "Suit";
  const linesParam = urlParams.get("lines");
  const lines = linesParam
    ? linesParam.split("|").map((line) => line.trim()).filter(Boolean)
    : (config.lines || []);

  if (!config || !config.cssVars) {
    return;
  }

  const cardRoot = document.getElementById("card-root");
  const cardValue = document.getElementById("card-value");
  const suitIcon = document.getElementById("suit-icon");
  const domainLabel = document.getElementById("domain-label");
  const rulesText = document.getElementById("rules-text");

  if (!cardRoot || !cardValue || !suitIcon || !domainLabel || !rulesText) {
    return;
  }

  if (globalThis.TrickCoreCards && Object.values(globalThis.TrickCoreCards).some(card => card.title === config.title)) {
    cardRoot.classList.add("core-card");
  }

  if (config.cardClass) {
    config.cardClass
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .forEach((token) => {
        cardRoot.classList.add(token);
      });
  }

  if (urlParams.get("export") === "1") {
    document.body.classList.add("export-page");
  }

  Object.entries(config.cssVars).forEach(([name, value]) => {
    cardRoot.style.setProperty(name, value);
  });

  const value = urlParams.get("value") || config.value || "";
  const title = urlParams.get("title") || config.title || "";
  const domain = urlParams.get("domain") || config.domain || "";

  cardValue.textContent = value;
  if (!value) {
    cardRoot.classList.add("no-value-card");
  }
  suitIcon.setAttribute("aria-label", suitLabel);
  if (suitSvgPath) {
    suitIcon.innerHTML = `<img src="${suitSvgPath}" alt="" aria-hidden="true">`;
  } else {
    suitIcon.innerHTML = (config.suitSvg || "").trim();
  }
  domainLabel.textContent = domain;
  rulesText.innerHTML = [`<strong>${title}</strong>`, ...lines].join("<br><br>");

  // Standard-deck cards use the catalogue layout from deck_cards.css: suit ink, inline mark,
  // a small-caps name over ruled paragraphs, and a reversed corner index.
  const icons = globalThis.TrickSuitIcons;
  const suitKey = (suitSvgPath.match(/([a-z]+)\.svg$/) || [])[1];
  if (cardRoot.classList.contains("core-card") && icons && icons.suits[suitKey]) {
    const suit = icons.suits[suitKey];
    const name = title.charAt(0) + title.slice(1).toLowerCase();
    cardRoot.style.setProperty("--suit-ink", suit.ink);
    suitIcon.innerHTML = icons.svg(suitKey, suit.name);
    domainLabel.textContent = domain.replace(" / ", " · ");
    rulesText.innerHTML = `<h2 class="core-title">${name}</h2><div class="core-rules">${lines.map((line) => `<p>${line}</p>`).join("")}</div>`;

    const index = document.createElement("div");
    index.className = "core-index";
    index.setAttribute("aria-hidden", "true");
    index.innerHTML = `<span>${value}</span>${icons.svg(suitKey)}`;
    cardRoot.appendChild(index);
  }
}());
