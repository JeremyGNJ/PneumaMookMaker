import {
  getSkillClassifications,
  normalizeSkillKey,
  type SkillCategory,
} from "./skill-settings.js";

export type SkillTargets = Partial<Record<SkillCategory, number>>;

export function getSkillUpdates(
  actor: Actor,
  targets: SkillTargets,
  willOverride: number,
): object[] {
  const classifications = getSkillClassifications();
  return Array.from(actor.items).flatMap((item) => {
    if (String(item.type) !== "skill" || !item.id || !item.name) return [];
    const category = classifications[normalizeSkillKey(item.name)];
    const target = category ? targets[category] : undefined;
    if (target === undefined) return [];

    const stat = String(foundry.utils.getProperty(item, "system.stat") ?? "");
    const statValue =
      stat === "will"
        ? willOverride
        : Number(foundry.utils.getProperty(actor, `system.stats.${stat}.value`));
    if (!Number.isFinite(statValue)) return [];
    return [{ _id: item.id, "system.level": Math.max(0, target - statValue) }];
  });
}

export function getAdjustedSkillTarget(
  selection: string,
  customAmount: string,
  combatNumber: number,
): number | null {
  if (selection === "unchanged") return null;
  if (selection === "minus-custom" && /^\d$/.test(customAmount)) {
    return combatNumber - Number(customAmount);
  }
  return Number.NaN;
}
