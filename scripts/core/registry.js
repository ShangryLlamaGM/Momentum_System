import { NAMESPACE } from "../core/constants.js";
import { MomentumActorSheet } from "../sheets/actor/ActorSheet.js";
import { MomentumItemSheet } from "../sheets/item/ItemSheet.js";

export function registerSheets() {
  // Actor sheets: explicitly list your Actor types so they show up in the defaults UI
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

  // Item sheets: list every item type your system supports so each can choose this sheet
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
