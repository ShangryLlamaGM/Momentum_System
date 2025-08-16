// remove the invalid import; use the global instead
import { sysPath } from "../../core/paths.js";
import { ensureTrackStates } from "../../util/items.js";
import { initTrack, computeTrackValue, renderTrackValueBadge } from "../../ui/components/track.js";

export class MomentumItemSheet extends foundry.applications.api.DocumentSheetV2 {
  // ...rest unchanged
}
