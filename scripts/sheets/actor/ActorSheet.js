import { DocumentSheetV2 } from foundry.applications.api;
import { sysPath } from "../../core/paths.js";
import { ensureTrackStates, groupByTypes } from "../../util/items.js";
import { initTrack, computeTrackValue, renderTrackValueBadge } from "../../ui/components/track.js";
import { qsa } from "../../util/dom.js";

export class MomentumActorSheet extends DocumentSheetV2 {
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      id: "momentum-actor-sheet",
      classes: ["momentum","sheet","actor"],
      window: { resizable: true, title: "Momentum Actor" }
    });
  }

  static TEMPLATE = sysPath("templates/sheets/actor.hbs");

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const items = Array.from(this.document.items ?? []);
    const groups = groupByTypes(items, [
      "anchor","aspect","resource","asset",
      "boon","bane","wound","condition","power","tag","facet","currency"
    ]);

    const prep = (arr) => arr.map(it => {
      const v = foundry.utils.duplicate(it);
      const st = ensureTrackStates(it);
      v.system = v.system || {};
      v.system.track = v.system.track || {};
      v.system.track.states = st;
      v.system.track.value = computeTrackValue(st);
      return v;
    });

    ctx.momentum = {
      anchors:   prep(groups.anchor),
      aspects:   prep(groups.aspect),
      resources: prep(groups.resource),
      assets:    prep(groups.asset),
      tags: {
        boons: prep(groups.boon),
        banes: prep(groups.bane),
        wounds: prep(groups.wound),
        conditions: prep(groups.condition),
        powers: prep(groups.power)
      },
      currencies: groups.currency.map(it => foundry.utils.duplicate(it))
    };

    ctx.partials = { track: sysPath("templates/partials/track.hbs") };
    return ctx;
  }

  async _activateListeners(html) {
    await super._activateListeners(html);
    const root = html;

    // Tracks
    qsa(root, "[data-item-id]").forEach(card => {
      const itemId = card.dataset.itemId;
      const item = this.document.items.get(itemId);
      if (!item) return;
      const track = card.querySelector(".track");
      if (!track) return;

      initTrack(card, async (index, action) => {
        const states = ensureTrackStates(item);
        const current = states[index] ?? "empty";
        const table = {
          left:      { empty:"outline", outline:"empty", fill:"outline", slash:"outline", cross:"outline" },
          right:     { empty:"fill",    outline:"fill",  fill:"empty",  slash:"fill",   cross:"fill" },
          shiftleft: { empty:"slash",   outline:"slash", fill:"slash",  slash:"empty", cross:"slash" },
          shiftright:{ empty:"cross",   outline:"cross", fill:"cross",  slash:"cross", cross:"empty" }
        };
        states[index] = (table[action] ?? table.left)[current] ?? "empty";
        await item.update({ "system.track.states": states });
        renderTrackValueBadge(card, computeTrackValue(states));
      });
    });

    // Currency
    qsa(root, "input.currency-amount").forEach(input => {
      const itemId = input.closest("[data-item-id]")?.dataset.itemId;
      const item = this.document.items.get(itemId);
      if (!item) return;
      input.addEventListener("change", async () => {
        const val = parseFloat(input.value || "0") || 0;
        await item.update({ "system.amount": val });
      });
      input.addEventListener("wheel", async (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const delta = ev.deltaY < 0 ? 1 : -1;
        const step = ev.shiftKey ? 10 : 1;
        const cur = parseFloat(input.value || "0") || 0;
        const next = cur + delta * step;
        input.value = String(next);
        await item.update({ "system.amount": next });
      });
    });
  }

  async _onDrop(event) {
    const data = event.dataTransfer?.getData("text/plain");
    if (!data) return;
    const json = JSON.parse(data);
    if (json?.type !== "Item") return;
    const item = await fromUuid(json.uuid);
    if (!item) return;
    if (item.parent?.id === this.document.id) return;
    await this.document.createEmbeddedDocuments("Item", [item.toObject()]);
  }
}
