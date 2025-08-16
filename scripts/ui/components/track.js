import { qsa, on } from "../../util/dom.js";

/** Compute numeric value from states: outlines(+) minus fills(-) */
export function computeTrackValue(states) {
  let outline = 0, fill = 0;
  for (const s of states) {
    if (s === "outline") outline++;
    else if (s === "fill") fill++;
  }
  return outline - fill;
}

function mapNext(current, action) {
  const map = {
    left:      { empty:"outline", outline:"empty", fill:"outline", slash:"outline", cross:"outline" },
    right:     { empty:"fill",    outline:"fill",  fill:"empty",  slash:"fill",   cross:"fill" },
    shiftleft: { empty:"slash",   outline:"slash", fill:"slash",  slash:"empty", cross:"slash" },
    shiftright:{ empty:"cross",   outline:"cross", fill:"cross",  slash:"cross", cross:"empty" }
  };
  return (map[action] ?? map.left)[current] ?? "empty";
}

/**
 * Wire a track container with click & keyboard behavior.
 * @param {HTMLElement} root
 * @param {(index:number, action:string)=>Promise<void>|void} onCellChange
 */
export function initTrack(root, onCellChange) {
  qsa(root, ".track").forEach(t => t.addEventListener("contextmenu", ev => ev.preventDefault()));

  qsa(root, ".track-cell").forEach(cell => {
    const idx = Number(cell.dataset.index || 0);

    on(cell, "mouseup", async (ev) => {
      if (![0,2].includes(ev.button)) return;
      ev.preventDefault();
      const action = ev.shiftKey ? (ev.button===2 ? "shiftright" : "shiftleft") : (ev.button===2 ? "right" : "left");
      await onCellChange(idx, action);
    });

    cell.setAttribute("tabindex","0");
    on(cell, "keydown", async (ev) => {
      const k = ev.key.toLowerCase();
      if (k === " " || k === "enter") { ev.preventDefault(); await onCellChange(idx, "left"); }
      else if (k === "arrowright" || k === "arrowdown") { ev.preventDefault(); await onCellChange(idx, "right"); }
      else if (k === "arrowleft" || k === "arrowup") { ev.preventDefault(); await onCellChange(idx, "left"); }
      else if (k === "x") { ev.preventDefault(); await onCellChange(idx, ev.shiftKey ? "shiftright" : "right"); }
      else if (k === "s") { ev.preventDefault(); await onCellChange(idx, ev.shiftKey ? "shiftright" : "shiftleft"); }
    });
  });
}

export function renderTrackValueBadge(container, value, position="after") {
  const badge = container.querySelector(".track-value");
  if (!badge) return;
  badge.textContent = String(value);
  badge.dataset.position = position;
}
