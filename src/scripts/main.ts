import { MODULE_ID, SUPPORTED_SYSTEM_ID } from "./constants.js";
import { ensureMookMakerFolders } from "./folders.js";
import { registerSkillClassificationSettings } from "./skill-settings.js";
import {
  registerTemplateTokenTagging,
  registerTokenHudAction,
} from "./tokens.js";

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

  registerSkillClassificationSettings();
  if (game.system?.id === SUPPORTED_SYSTEM_ID) {
    registerTemplateTokenTagging();
    registerTokenHudAction();
  }
});

Hooks.once("ready", async () => {
  console.info(`${MODULE_ID} | Ready`);
  if (game.system?.id !== SUPPORTED_SYSTEM_ID) {
    const message = `${MODULE_ID} requires the Cyberpunk RED Core system (${SUPPORTED_SYSTEM_ID}).`;
    console.error(`${MODULE_ID} | ${message}`);
    ui.notifications?.error(message, { permanent: true });
    return;
  }
  await ensureMookMakerFolders();
});
