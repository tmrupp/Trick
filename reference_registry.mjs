import "./races/race_catalog.js";
import "./rules_reference.js";

const RULES_PAGE_PATH = "rules_reference_card.html";

// The reference deck is the six peoples, each backed by the shared timing card,
// followed by the two rules cards, each printed front and back.
export function buildReferenceDeckCards() {
	const sides = globalThis.TrickRulesCard.sides;
	const cards = [...new Set(sides.map((side) => side.card))];

	return [
		...globalThis.TrickRaceCatalog.buildRaceDeckCards(),
		...cards.map((card, index) => {
			const [front, back] = sides.filter((side) => side.card === card);
			return {
				id: card,
				label: `Rules Reference ${index + 1}`,
				file: RULES_PAGE_PATH,
				params: { side: front.side },
				backFile: RULES_PAGE_PATH,
				backParams: { side: back.side }
			};
		})
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
