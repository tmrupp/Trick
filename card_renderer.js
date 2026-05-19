(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const config = typeof CARD_VARIANT_CONFIG !== "undefined"
    ? CARD_VARIANT_CONFIG
    : (window.CARD_VARIANT_CONFIG || {});

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

  if (config.cardClass) {
    cardRoot.classList.add(config.cardClass);
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
  suitIcon.setAttribute("aria-label", config.suitLabel || "Suit");
  if (config.suitSvgPath) {
    suitIcon.innerHTML = `<img src="${config.suitSvgPath}" alt="" aria-hidden="true">`;
  } else {
    suitIcon.innerHTML = (config.suitSvg || "").trim();
  }
  domainLabel.textContent = domain;
  rulesText.innerHTML = [`<strong>${title}</strong>`, ...(config.lines || [])].join("<br><br>");
}());