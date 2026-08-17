import { MODULE_ID } from "./constants.js";
import { isPurgeConfirmationEnabled } from "./skill-settings.js";

const PURGEABLE_GEAR_TYPES = new Set([
  "armor", "clothing", "cyberware", "drug", "gear", "itemUpgrade", "weapon",
]);

function getPurgeableGear(actor: Actor): Item[] {
  const protectedIds = new Set<string>();
  const childrenByParent = new Map<string, string[]>();
  const actorInstalledItems = foundry.utils.getProperty(
    actor,
    "system.installedItems.list",
  );
  if (Array.isArray(actorInstalledItems)) {
    for (const id of actorInstalledItems) {
      if (typeof id === "string") protectedIds.add(id);
    }
  }

  for (const item of actor.items) {
    if (!item.id) continue;
    const state = String(
      foundry.utils.getProperty(item, "system.equipped") ?? "",
    ).toLowerCase();
    if (state === "equipped" || state === "carried") protectedIds.add(item.id);

    const installedItems = foundry.utils.getProperty(
      item,
      "system.installedItems.list",
    );
    if (!Array.isArray(installedItems)) continue;
    const children = installedItems.filter(
      (id): id is string => typeof id === "string",
    );
    childrenByParent.set(item.id, children);
    for (const id of children) protectedIds.add(id);
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const [parentId, childIds] of childrenByParent) {
      if (protectedIds.has(parentId)) {
        for (const childId of childIds) {
          if (!protectedIds.has(childId)) {
            protectedIds.add(childId);
            changed = true;
          }
        }
      }
      if (
        childIds.some((childId) => protectedIds.has(childId)) &&
        !protectedIds.has(parentId)
      ) {
        protectedIds.add(parentId);
        changed = true;
      }
    }
  }

  return Array.from(actor.items).filter((item) => {
    if (!item.id || !PURGEABLE_GEAR_TYPES.has(String(item.type))) return false;
    if (protectedIds.has(item.id)) return false;
    const state = String(
      foundry.utils.getProperty(item, "system.equipped") ?? "",
    ).toLowerCase();
    return state !== "equipped" && state !== "carried";
  }) as Item[];
}

async function purgeGear(token: Token): Promise<boolean> {
  const actor = token.actor;
  if (!actor || token.document.actorLink) {
    ui.notifications?.warn(
      game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.UnlinkedOnly"),
    );
    return false;
  }
  const ids = getPurgeableGear(actor).flatMap((item) =>
    item.id ? [item.id] : [],
  );
  if (ids.length === 0) {
    ui.notifications?.info(
      game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.NothingToPurge"),
    );
    return true;
  }
  try {
    await actor.deleteEmbeddedDocuments("Item", ids);
    ui.notifications?.info(
      game.i18n!.format("PNEUMA_MOOK_MAKER.Form.GearPurged", { count: ids.length }),
    );
    return true;
  } catch (error) {
    console.error(`${MODULE_ID} | Failed to purge mook gear`, error);
    ui.notifications?.error(
      game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.PurgeFailed"),
    );
    return false;
  }
}

export function confirmPurgeGear(token: Token): void {
  const actor = token.actor;
  if (!actor) return;
  const count = getPurgeableGear(actor).length;
  if (count === 0) {
    ui.notifications?.info(
      game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.NothingToPurge"),
    );
    return;
  }
  if (!isPurgeConfirmationEnabled()) {
    void purgeGear(token);
    return;
  }
  new Dialog({
    title: game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.PurgeConfirmTitle"),
    content: `<p>${game.i18n!.format("PNEUMA_MOOK_MAKER.Form.PurgeWarning", { count })}</p>`,
    buttons: {
      confirm: {
        icon: '<i class="fas fa-trash"></i>',
        label: game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.PurgeGear"),
        callback: async () => { await purgeGear(token); },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.Cancel"),
      },
    },
    default: "cancel",
  }).render(true);
}
