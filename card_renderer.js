(function () {
  function getInlineItemIcon(svgPath) {
    const normalized = (svgPath || "").replace(/\\/g, "/").toLowerCase();
    if (normalized.endsWith("trinklet.svg")) {
      return `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"><path d="M 24 32 C 24 96, 104 96, 104 32" /><path d="M 64 78 L 76 96 L 64 114 L 52 96 Z" /></g></svg>`;
    }
    if (normalized.endsWith("relic.svg")) {
      return `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"><path d="M 30, 75 L 42, 50 L 52, 60 L 64, 32 L 76, 60 L 86, 50 L 98, 75 Q 98, 90 64, 90 Q 30, 90 30, 75 Z" /></g></svg>`;
    }
    return "";
  }

  const urlParams = new URLSearchParams(window.location.search);
  const config = typeof CARD_VARIANT_CONFIG !== "undefined"
    ? CARD_VARIANT_CONFIG
    : (window.CARD_VARIANT_CONFIG || {});

  const suitSvgPath = urlParams.get("suitSvgPath") || config.suitSvgPath || "";
  const itemIconSvgPath = urlParams.get("itemIconSvgPath") || config.itemIconSvgPath || "";
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
  const itemIcon = document.querySelector(".item-icon");
  const suitIcon = document.getElementById("suit-icon");
  const domainLabel = document.getElementById("domain-label");
  const rulesText = document.getElementById("rules-text");

  if (!cardRoot || !cardValue || !suitIcon || !domainLabel || !rulesText) {
    return;
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
  if (itemIcon && itemIconSvgPath) {
    itemIcon.classList.add("item-icon--custom");
    const inlineIcon = getInlineItemIcon(itemIconSvgPath);
    itemIcon.innerHTML = inlineIcon || `<img src="${itemIconSvgPath}" alt="" aria-hidden="true">`;
  }
  suitIcon.setAttribute("aria-label", suitLabel);
  if (suitSvgPath) {
    suitIcon.innerHTML = `<img src="${suitSvgPath}" alt="" aria-hidden="true">`;
  } else {
    suitIcon.innerHTML = (config.suitSvg || "").trim();
  }
  domainLabel.textContent = domain;
  rulesText.innerHTML = [`<strong>${title}</strong>`, ...lines].join("<br><br>");
}());