(function () {
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
    itemIcon.innerHTML = `<img src="${itemIconSvgPath}" alt="" aria-hidden="true">`;
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