// scripts/core/registry.js
import { NAMESPACE } from "../core/constants.js";
import { MomentumActorSheet } from "../sheets/actor/ActorSheet.js";
import { MomentumItemSheet } from "../sheets/item/ItemSheet.js";

/**
 * Register Momentum sheets for Foundry v13 using DocumentSheetConfig.
 * Adds labels and explicit types so they appear in Configure Sheets and can be defaults.
 */
export function registerSheets() {
  // Actor sheets
  DocumentSheetConfig.registerSheet(
    foundry.documents.Actor,
    NAMESPACE,
    MomentumActorSheet,
    {
      label: "Momentum Actor",
      types: ["character", "threat"],
      makeDefault: true
    }
  );

  // Item sheets
  DocumentSheetConfig.registerSheet(
    foundry.documents.Item,
    NAMESPACE,
    MomentumItemSheet,
    {
      label: "Momentum Item",
      types: [
        "anchor","aspect","resource","asset",
        "boon","bane","wound","condition","power",
        "tag","facet","currency"
      ],
      makeDefault: true
    }
  );
}
