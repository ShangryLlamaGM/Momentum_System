import { NAMESPACE } from "../core/constants.js";
import { MomentumActorSheet } from "../sheets/actor/ActorSheet.js";
import { MomentumItemSheet } from "../sheets/item/ItemSheet.js";

export function registerSheets() {
  DocumentSheetConfig.registerSheet(foundry.documents.Actor, NAMESPACE, MomentumActorSheet, { makeDefault: true });
  DocumentSheetConfig.registerSheet(foundry.documents.Item,  NAMESPACE, MomentumItemSheet,  { makeDefault: true });
}
