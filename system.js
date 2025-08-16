// system.js
const ID = "momentum";

/** Utility: default states array */
function ensureStatesArray(item) {
  const sys = item.system ?? {};
  const tr = sys.track ?? {};
  if (!tr.enabled) return [];
  const len = Math.max(0, Number(tr.length) || 0);
  let states = Array.isArray(tr.states) ? tr.states.slice(0, len) : [];
  if (states.length < len) {
    states = states.concat(Array(len - states.length).fill("empty"));
  }
  return states;
}

/** Compute display value: +1 per outline, -1 per fill */
function computeTrackValue(states) {
  let v = 0;
  for (const s of states) {
    if (s === "outline") v += 1;
    else if (s === "fill") v -= 1;
  }
  return v;
}

/** Apply state toggle rules */
function nextStateFor(action, current) {
  // allowed states: empty | outline | slash | cross | fill
  const target = {
    "outline": "outline",
    "fill": "fill",
    "slash": "slash",
    "cross": "cross"
  }[action];

  if (!target) return current;
  // toggle: if already that state -> empty; else -> that state
  return current === target ? "empty" : target;
}

/** Map DOM event to action */
function actionFromEvent(ev) {
  const isRight = ev.type === "contextmenu" || ev.button === 2;
  const shift = ev.shiftKey === true;
  if (!isRight && !shift) return "outline";       // left click
  if (isRight && !shift) return "fill";          // right click
  if (!isRight && shift) return "slash";         // shift-left
  if (isRight && shift) return "cross";          // shift-right
  return null;
}

// --- Simple Actor Sheet with modular sections ---
class MomentumActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["momentum", "sheet", "actor"],
      template: "systems/momentum/templates/sheets/actor-basic.hbs",
      width: 760,
      height: 560,
      resizable: true
    });
  }

  async getData(options) {
    const ctx = await super.getData(options);
    // Partition items by type for basic modules
    const items = this.actor.items.contents;
    function byType(t) { return items.filter(i => i.type === t); }
    ctx.momentum = {
      anchors: byType("anchor"),
      aspects: byType("aspect"),
      resources: byType("resource"),
      currencies: byType("currency"),
      tags: {
        assets: byType("asset"),
        boons: byType("boon"),
        banes: byType("bane"),
        wounds: byType("wound"),
        conditions: byType("condition"),
        powers: byType("power")
      }
    };
    // Precompute track states & values for rendering
    for (const it of items) {
      const states = ensureStatesArray(it);
      const color = (it.system?.track?.color ?? "green");
      const colorFamily = color === "red" ? "core" : (color === "green" ? "edge" : "frame");
      if (it.system.track) {
        it.system.track.states = states; // ensure length
        it.system.track.colorFamily = colorFamily;
      }
      it.system._computedValue = computeTrackValue(states);
    }
    return ctx;
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Prevent default context-menu on track cells
    html.on("contextmenu", ".track-cell", ev => ev.preventDefault());

    // Track interactions
    html.on("click contextmenu", ".track-cell", async ev => {
      ev.preventDefault();
      const el = ev.currentTarget;
      const idx = Number(el.dataset.index || 0);
      const card = el.closest("[data-item-id]");
      const itemId = card?.dataset.itemId;
      if (!itemId) return;

      const item = this.actor.items.get(itemId);
      if (!item) return;
      const states = ensureStatesArray(item);

      const action = actionFromEvent(ev);
      if (!action) return;

      states[idx] = nextStateFor(action, states[idx]);
      await item.update({ "system.track.states": states });

      // Update badge for visual feedback
      const v = computeTrackValue(states);
      const badge = html.find(`[data-item-id="${itemId}"] .track-badge-value`);
      if (badge.length) badge.text(v);
      // Update CSS classes for the cell
      const $cell = $(el);
      $cell.removeClass("state-empty state-outline state-slash state-cross state-fill")
           .addClass(`state-${states[idx]}`);
    });

    // Currency amount change
    html.on("change", ".currency-amount", async ev => {
      const input = ev.currentTarget;
      const card = input.closest("[data-item-id]");
      const itemId = card?.dataset.itemId;
      if (!itemId) return;

      const item = this.actor.items.get(itemId);
      if (!item) return;
      const val = parseFloat(input.value || "0") || 0;
      await item.update({ "system.amount": val });
    });

    // Currency amount mouse wheel
    html.on("wheel", ".currency-amount", async ev => {
      ev.preventDefault();
      ev.stopPropagation();
      const input = ev.currentTarget;
      const card = input.closest("[data-item-id]");
      const itemId = card?.dataset.itemId;
      if (!itemId) return;
      const item = this.actor.items.get(itemId);
      if (!item) return;
      const delta = ev.deltaY < 0 ? 1 : -1; // up = +1, down = -1
      const step = ev.shiftKey ? 10 : 1;
      const current = parseFloat(input.value || "0") || 0;
      const next = current + delta * step;
      input.value = next;
      await item.update({ "system.amount": next });
    });
  }

  /** Basic onDrop: create embedded item as-is */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    if (data.type !== "Item") return super._onDrop(event);
    const item = await Item.implementation.fromDropData(data);
    if (!item) return;
    return this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
  }
}

Hooks.once("init", async function() {
  console.log(`${ID} | Initializing v13 GO build (0.0.3)`);

  game.settings.register(ID, "enableEdges", {
    name: "Enable EDGEs",
    hint: "Turn on optional EDGE rules/components (GREEN, TRIANGLE).",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(ID, "enableFrames", {
    name: "Enable FRAMEs",
    hint: "Turn on optional FRAME modules (BLUE, SQUARE).",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Use our basic sheet for all actor types by default
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet(ID, MomentumActorSheet, { makeDefault: true });

  // Preload templates (partials + sheet)
  await loadTemplates([
    "systems/momentum/templates/partials/track.hbs",
    "systems/momentum/templates/sheets/actor-basic.hbs"
  ]);
});

Hooks.once("ready", function() {
  console.log(`${ID} | Ready`);
});
