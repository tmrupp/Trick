// Campaign saves: one JSON file per campaign in the saves folder.
// A save holds the seed and every action, so the game state is rebuilt by replaying it.
import { mkdirSync, readFileSync, writeFileSync, renameSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const CODE_LETTERS = "BCDFGHJKLMNPQRSTVWXZ"; // no vowels, so codes never spell words

export function newCode(taken = new Set()) {
  for (;;) {
    const bytes = randomBytes(5);
    const code = [...bytes].map((b) => CODE_LETTERS[b % CODE_LETTERS.length]).join("");
    if (!taken.has(code)) return code;
  }
}

export const newSecret = (bytes = 18) => randomBytes(bytes).toString("base64url");

export class Store {
  constructor(dir) {
    this.dir = dir;
    mkdirSync(dir, { recursive: true });
  }

  path(id) {
    if (!/^[a-z0-9-]{1,64}$/.test(id)) throw new Error("Bad campaign id.");
    return join(this.dir, `${id}.json`);
  }

  list() {
    return readdirSync(this.dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        try {
          const s = JSON.parse(readFileSync(join(this.dir, f), "utf8"));
          return { id: s.id, name: s.name, code: s.code, updatedAt: s.updatedAt, characters: s.characterNames || [], actions: s.actions.length };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  }

  create({ name, seed, takenCodes }) {
    const base = String(name || "campaign").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "campaign";
    let id = base;
    for (let n = 2; existsSync(this.path(id)); n++) id = `${base}-${n}`;
    const now = new Date().toISOString();
    const save = {
      id, name: name || id, code: newCode(takenCodes), gmKey: newSecret(),
      seed: String(seed ?? newSecret(9)), gmSeat: 0,
      actions: [], seats: [], characterNames: [],
      createdAt: now, updatedAt: now,
    };
    this.write(save);
    return save;
  }

  read(id) {
    return JSON.parse(readFileSync(this.path(id), "utf8"));
  }

  // Write to a temporary file, then rename, so a crash never leaves half a save.
  write(save) {
    save.updatedAt = new Date().toISOString();
    const file = this.path(save.id);
    writeFileSync(`${file}.tmp`, JSON.stringify(save, null, 1));
    renameSync(`${file}.tmp`, file);
  }
}
