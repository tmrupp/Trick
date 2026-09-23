import "./races/race_catalog.js";
import "./rules_reference.js";

const RULES_PAGE_PATH = "rules_reference_card.html";

// The reference deck is the six peoples, each backed by the shared timing card,
// followed by the two-sided rules card.
export function buildReferenceDeckCards() {
	const [front, back] = globalThis.TrickRulesCard.sides;

	return [
		...globalThis.TrickRaceCatalog.buildRaceDeckCards(),
		{
			id: "rules-card",
			label: "Rules Reference",
			file: RULES_PAGE_PATH,
			params: { side: front.side },
			backFile: RULES_PAGE_PATH,
			backParams: { side: back.side }
		}
	];
}

export function raceCatalog() {
	return globalThis.TrickRaceCatalog.raceCatalog;
}

export function sharedTimingId() {
	return globalThis.TrickRaceCatalog.sharedTiming.id;
}

export function rulesSides() {
	return globalThis.TrickRulesCard.sides;
}
