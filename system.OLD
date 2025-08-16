// system.js — delta 0.0.7
// - Uses v13 namespaced APIs:
//   * foundry.documents.collections.Actors.registerSheet(...)
//   * foundry.applications.handlebars.loadTemplates([...])
//   * foundry.applications.handlebars.renderTemplate(...)
// - Includes a Handlebars mixin fallback so the sheet is always renderable.
// - No system.json changes required.

const ID = "momentum";

/** ---- Handlebars mixin (with safe fallback) ---- */
const HB_MIXIN = (function() {
  const api = foundry?.applications?.api;
  const hb = foundry?.applications?.handlebars;
  if (api?.HandlebarsApplicationMixin) return api.HandlebarsApplicationMixin;
  console.warn(`${ID} | HandlebarsApplicationMixin not found; using fallback renderer.`);
  return (Base) => class extends Base {
    static get TEMPLATE() { return this._TEMPLATE ?? ""; }
    static set TEMPLATE(v) { this._TEMPLATE = v; }
    async _renderHTML(_options) {
      const ctx = await this._prepareContext(_options);
      const tpl = this.constructor.TEMPLATE;
      if (!tpl) throw new Error(`${ID} | No TEMPLATE defined for ${this.constructor.name}`);
      const render = hb?.renderTemplate ?? renderTemplate; // prefer namespaced
      const html = await render(tpl, ctx);
      return document.createRange().createContextualFragment(html);
    }
    async _replaceHTML(result, _options) {
      let el = this.element;
      if (!el) {
        el = document.createElement("section");
        el.classList.add(...(this.options?.classes ?? []));
        this.element = el;
      } else {
        el.innerHTML = "";
      }
      el.append(result);
      return el;
    }
  };
})();

/** Track helpers */
function ensureStatesArray(item) {
  const sys = item.system ?? {};
  const tr = sys.track ?? {};
  if (!tr.enabled) return [];
  const len = Math.max(0, Number(tr.length) || 0);
  let states = Array.isArray(tr.states) ? tr.states.slice(0, len) : [];
  if (states.length < len) states = states.concat(Array(len - states.length).fill("empty"));
  return states;
}
function computeTrackValue(states) {
  let v = 0;
  for (const s of states) {
    if (s === "outline") v += 1;
    else if (s === "fill") v -= 1;
  }
  return v;
}
function actionFromEvent(ev) {
  const isRight = ev.type === "contextmenu" || ev.button === 2;
  const shift = ev.shiftKey === true;
  if (!isRight && !shift) return "outline";
  if (isRight && !shift) return "fill";
  if (!isRight && shift) return "slash";
  if (isRight && shift) return "cross";
  return null;
}
function nextStateFor(action, current) {
  const target = { outline: "outline", fill: "fill", slash: "slash", cross: "cross" }[action];
  if (!target) return current;
  return current === target ? "empty" : target;
}

// --- Actor Sheet (ApplicationV2 + Handlebars or fallback) ---
class MomentumActorSheet extends HB_MIXIN(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    id: "momentum-actor-sheet",
    classes: ["momentum", "sheet", "actor"],
    position: { width: 760, height: 560 },
    window: { title: "Momentum Actor" }
  });

  static TEMPLATE = "systems/momentum/templates/sheets/actor-basic.hbs";

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

  async _postRender(context, options) {
    await super._postRender?.(context, options);
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

  async _onDropItem(event, item) {
    if (item?.parent?.id === this.actor.id) return super._onDropItem(event, item);
    return this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
  }
}

Hooks.once("init", async function() {
  console.log(`${ID} | Initializing AppV2 sheet (delta 0.0.7)`);

  // Namespaced registration (v13+)
  foundry.documents.collections.Actors.registerSheet(ID, MomentumActorSheet, { makeDefault: true });

  // Prefer namespaced loadTemplates
  const load = foundry?.applications?.handlebars?.loadTemplates ?? loadTemplates;
  await load([
    "systems/momentum/templates/partials/track.hbs"
  ]);
});

Hooks.once("ready", function() {
  console.log(`${ID} | Ready (AppV2)`);
});
