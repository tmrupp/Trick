// The item catalog as the host serves it. Relic Price cards are hidden information: the pages get the catalog with
// every Price card's text removed, and the text itself travels only in viewFor (view.itemPrices), to the GM always and
// to the players and table once the GM reveals it.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

export function loadItemCatalog(repo) {
  // items/item_catalog.js is a browser script that sets globalThis.TrickItemCatalog; run it in a sandbox to read it.
  const sandbox = {};
  sandbox.globalThis = sandbox;
  runInNewContext(readFileSync(join(repo, "items", "item_catalog.js"), "utf8"), sandbox, { filename: "item_catalog.js" });
  const entries = sandbox.TrickItemCatalog.itemCatalog;
  // itemId → the Price card's lines, for each Relic.
  const prices = Object.fromEntries(entries.filter((e) => e.kind === "reveal").map((e) => [e.id.replace(/-price$/, ""), (e.lines || []).slice()]));
  // The pages need to know which items have a Price card, not what it says.
  const shown = entries.map((e) => (e.kind === "reveal" ? { id: e.id, kind: e.kind, suit: e.suit, label: e.label } : e));
  const script = `// Served by the TRICK host from items/item_catalog.js, with Relic Price text removed (see game/server/items.mjs).
globalThis.TrickItemCatalog = { itemCatalog: ${JSON.stringify(shown)} };
`;
  return { prices, script };
}
