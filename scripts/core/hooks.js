import { sysPath } from "./paths.js";
import { registerSheets } from "./registry.js";

Hooks.once("init", async () => {
  console.log("momentum | init(v13)");

  const load = foundry?.applications?.handlebars?.loadTemplates;
  if (typeof load === "function") {
    await load([
      sysPath("templates/sheets/actor.hbs"),
      sysPath("templates/sheets/item.hbs"),
      sysPath("templates/partials/track.hbs")
    ]);
  }

  registerSheets();
});

Hooks.once("ready", () => console.log("momentum | ready(v13)"));
