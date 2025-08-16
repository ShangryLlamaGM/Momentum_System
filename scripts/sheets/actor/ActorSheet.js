// remove the invalid import; use the global instead
import { sysPath } from "../../core/paths.js";
import { ensureTrackStates, groupByTypes } from "../../util/items.js";
import { initTrack, computeTrackValue, renderTrackValueBadge } from "../../ui/components/track.js";
import { qsa } from "../../util/dom.js";

export class MomentumActorSheet extends foundry.applications.api.DocumentSheetV2 {
  // ...rest unchanged
}
