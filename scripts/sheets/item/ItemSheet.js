import { DocumentSheetV2 } from foundry.applications.api;
import { sysPath } from "../../core/paths.js";
import { ensureTrackStates } from "../../util/items.js";
import { initTrack, computeTrackValue, renderTrackValueBadge } from "../../ui/components/track.js";

export class MomentumItemSheet extends DocumentSheetV2 {
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      id: "momentum-item-sheet",
      classes: ["momentum","sheet","item"],
      window: { resizable: true, title: "Momentum Item" }
    });
  }

  static TEMPLATE = sysPath("templates/sheets/item.hbs");

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const it = this.document;
    const copy = foundry.utils.duplicate(it);
    const st = ensureTrackStates(it);
    copy.system = copy.system || {};
    copy.system.track = copy.system.track || {};
    copy.system.track.states = st;
    copy.system.track.value = computeTrackValue(st);
    ctx.itemVM = copy;
    ctx.partials = { track: sysPath("templates/partials/track.hbs") };
    return ctx;
  }

  async _activateListeners(html) {
    await super._activateListeners(html);
    const root = html;

    const track = root.querySelector(".track");
    if (track) {
      initTrack(root, async (index, action) => {
        const states = ensureTrackStates(this.document);
        const table = {
          left:      { empty:"outline", outline:"empty", fill:"outline", slash:"outline", cross:"outline" },
          right:     { empty:"fill",    outline:"fill",  fill:"empty",  slash:"fill",   cross:"fill" },
          shiftleft: { empty:"slash",   outline:"slash", fill:"slash",  slash:"empty", cross:"slash" },
          shiftright:{ empty:"cross",   outline:"cross", fill:"cross",  slash:"cross", cross:"empty" }
        };
        const current = states[index] ?? "empty";
        states[index] = (table[action] ?? table.left)[current] ?? "empty";
        await this.document.update({ "system.track.states": states });
        renderTrackValueBadge(root, computeTrackValue(states));
      });
    }

    if (this.document.type === "currency") {
      const input = root.querySelector("input.currency-amount");
      if (input) {
        input.addEventListener("change", async () => {
          const val = parseFloat(input.value || "0") || 0;
          await this.document.update({ "system.amount": val });
        });
        input.addEventListener("wheel", async (ev) => {
          ev.preventDefault(); ev.stopPropagation();
          const delta = ev.deltaY < 0 ? 1 : -1;
          const step  = ev.shiftKey ? 10 : 1;
          const cur   = parseFloat(input.value || "0") || 0;
          const next  = cur + delta * step;
          input.value = String(next);
          await this.document.update({ "system.amount": next });
        });
      }
    }
  }
}
