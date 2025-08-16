// system.js (v0.0.5) — ApplicationV2 + Handlebars mixin
const ID = "momentum";

/** Utility: normalize states array to desired length */
function ensureStatesArray(item) {
  const sys = item.system ?? {};
  const tr = sys.track ?? {};
  if (!tr.enabled) return [];
  const len = Math.max(0, Number(tr.length) || 0);
  let states = Array.isArray(tr.states) ? tr.states.slice(0, len) : [];
  if (states.length < len) states = states.concat(Array(len - states.length).fill("empty"));
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

/** Map event -> action */
function actionFromEvent(ev) {
  const isRight = ev.type === "contextmenu" || ev.button === 2;
  const shift = ev.shiftKey === true;
  if (!isRight && !shift) return "outline";
  if (isRight && !shift) return "fill";
  if (!isRight && shift) return "slash";
  if (isRight && shift) return "cross";
  return null;
}

/** Toggle to target or empty */
function nextStateFor(action, current) {
  const target = { outline: "outline", fill: "fill", slash: "slash", cross: "cross" }[action];
  if (!target) return current;
  return current === target ? "empty" : target;
}

// --- Actor Sheet (ApplicationV2 + Handlebars) ---
const { HandlebarsApplicationMixin } = foundry.applications.api;

class MomentumActorSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    id: "momentum-actor-sheet",
    classes: ["momentum", "sheet", "actor"],
    position: { width: 760, height: 560 },
    window: { title: "Momentum Actor" }
  });

  // Handlebars parts rendered by this sheet
  static PARTS = {
    body: { template: "systems/momentum/templates/sheets/actor-basic.hbs", scrollable: [".sheet-body"] }
  };

  // Prepare render context
  async _prepareContext(_options) {
    const context = await super._prepareContext(_options);
    const items = this.actor.items.contents;
    const byType = (t) => items.filter((i) => i.type === t);

    context.momentum = {
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

    for (const it of items) {
      const states = ensureStatesArray(it);
      const color = it.system?.track?.color ?? "green";
      const colorFamily = color === "red" ? "core" : (color === "green" ? "edge" : "frame");
      if (it.system.track) {
        it.system.track.states = states;
        it.system.track.colorFamily = colorFamily;
      }
      it.system._computedValue = computeTrackValue(states);
    }

    return context;
  }

  // Bind listeners after render
  async _postRender(context, options) {
    await super._postRender(context, options);
    const root = this.element;

    root.querySelectorAll(".track-cell").forEach((cell) => {
      cell.addEventListener("contextmenu", (ev) => ev.preventDefault());
      cell.addEventListener("click", (ev) => this.#onTrackClick(ev));
      cell.addEventListener("mouseup", (ev) => { if (ev.button === 2) this.#onTrackClick(ev); });
    });

    root.querySelectorAll(".currency-amount").forEach((input) => {
      input.addEventListener("change", (ev) => this.#onCurrencyChange(ev));
      input.addEventListener("wheel", (ev) => this.#onCurrencyWheel(ev));
    });
  }

  async #onTrackClick(ev) {
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
    const v = computeTrackValue(states);
    const badge = card.querySelector(".track-badge-value");
    if (badge) badge.textContent = String(v);
    el.classList.remove("state-empty","state-outline","state-slash","state-cross","state-fill");
    el.classList.add(`state-${states[idx]}`);
  }

  async #onCurrencyChange(ev) {
    const input = ev.currentTarget;
    const card = input.closest("[data-item-id]");
    const itemId = card?.dataset.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const val = parseFloat(input.value || "0") || 0;
    await item.update({ "system.amount": val });
  }

  async #onCurrencyWheel(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    const input = ev.currentTarget;
    const card = input.closest("[data-item-id]");
    const itemId = card?.dataset.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const delta = ev.deltaY < 0 ? 1 : -1;
    const step = ev.shiftKey ? 10 : 1;
    const current = parseFloat(input.value || "0") || 0;
    const next = current + delta * step;
    input.value = String(next);
    await item.update({ "system.amount": next });
  }

  // Drag+drop items
  async _onDropItem(event, item) {
    if (item?.parent?.id === this.actor.id) return super._onDropItem(event, item);
    return this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
  }
}

Hooks.once("init", async function() {
  console.log(`${ID} | Initializing v13 AppV2 + Handlebars (0.0.5)`);

  game.settings.register(ID, "enableEdges", {
    name: "Enable EDGEs",
    hint: "Turn on optional EDGE rules/components (GREEN, TRIANGLE).",
    scope: "world", config: true, type: Boolean, default: true
  });
  game.settings.register(ID, "enableFrames", {
    name: "Enable FRAMEs",
    hint: "Turn on optional FRAME modules (BLUE, SQUARE).",
    scope: "world", config: true, type: Boolean, default: true
  });

  // Register our V2 sheet as default
  Actors.registerSheet(ID, MomentumActorSheet, { makeDefault: true });

  await loadTemplates([
    "systems/momentum/templates/partials/track.hbs",
    "systems/momentum/templates/sheets/actor-basic.hbs"
  ]);
});

Hooks.once("ready", function() {
  console.log(`${ID} | Ready (AppV2 + Handlebars)`);
});
