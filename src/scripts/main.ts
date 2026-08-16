import { MODULE_ID } from "./constants.js";

export interface PneumaMookMakerApi {
  readonly moduleId: typeof MODULE_ID;
}

type ModuleWithApi = {
  api?: PneumaMookMakerApi;
};

Hooks.once("init", () => {
  console.info(`${MODULE_ID} | Initializing`);

  const module = game.modules?.get(MODULE_ID) as ModuleWithApi | undefined;
  if (module) {
    module.api = { moduleId: MODULE_ID } satisfies PneumaMookMakerApi;
  }
});

Hooks.once("ready", () => {
  console.info(`${MODULE_ID} | Ready`);
});
