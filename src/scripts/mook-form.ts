import { getArmorUpdates, getCurrentArmorSelections } from "./armor.js";
import { applyMookChanges } from "./apply-mook.js";
import {
  getAdjustedSkillTarget,
  getCurrentCombatNumber,
  getSkillUpdates,
  type SkillTargets,
} from "./skills.js";
import { getStatsForHitPoints } from "./stats.js";
import { confirmPurgeGear } from "./purge.js";
import { confirmPromotion } from "./promotion.js";
import { getAvailableSystemRoles, type AvailableRole } from "./roles.js";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#039;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

function getRadioChoices(
  name: string,
  values: readonly string[],
  selected: string,
  className = "pneuma-mook-maker-radio-row",
  suffix = "",
): string {
  const choices = values
    .map(
      (value) => `
        <label class="pneuma-mook-maker-radio">
          <input type="radio" name="${name}" value="${value}"${value === selected ? " checked" : ""}>
          <span>${value}</span>
        </label>`,
    )
    .join("");

  return `<div class="${className}">${choices}${suffix}</div>`;
}

function getSkillAdjustmentOptions(name: string): string {
  return `
    <div class="pneuma-mook-maker-skill-adjustment" data-skill-adjustment="${name}">
      <div class="pneuma-mook-maker-radio-column">
        <label class="pneuma-mook-maker-radio">
          <input type="radio" name="${name}" value="unchanged" checked>
          <span>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.Unchanged")}</span>
        </label>
        <label class="pneuma-mook-maker-radio pneuma-mook-maker-minus-custom">
          <input type="radio" name="${name}" value="minus-custom">
          <span>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.CombatNumberMinus")}</span>
          <input type="text" name="${name}Minus" inputmode="numeric" pattern="[0-9]"
            maxlength="1" aria-label="${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.CombatNumberMinusAmount")}" disabled>
        </label>
      </div>
    </div>`;
}

function getMookMakerForm(token: Token, availableRoles: AvailableRole[]): string {
  const name = escapeHtml(token.document.name ?? token.actor?.name ?? "");
  const actor = token.actor ?? {};
  const actorDocument = token.actor;
  const currentCombatNumber = actorDocument
    ? getCurrentCombatNumber(actorDocument)
    : null;
  const currentCombatSelection = currentCombatNumber === 8
    ? "Civilian"
    : currentCombatNumber !== null && currentCombatNumber >= 10 && currentCombatNumber <= 14
      ? String(currentCombatNumber)
      : currentCombatNumber !== null
        ? "custom"
        : "No change";
  const customCombatValue = currentCombatSelection === "custom"
    ? String(currentCombatNumber)
    : "";
  const customCombatChoice = `
    <label class="pneuma-mook-maker-radio pneuma-mook-maker-custom-choice">
      <input type="radio" name="combatNumber" value="custom"${currentCombatSelection === "custom" ? " checked" : ""}>
      <span>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.Custom")}</span>
      <input class="pneuma-mook-maker-custom-number" name="customCombatNumber" type="text"
        inputmode="numeric" pattern="(?:[89]|1[0-9]|20)" maxlength="2" value="${customCombatValue}"
        aria-label="${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.CustomCombatNumber")}"${currentCombatSelection === "custom" ? "" : " disabled"}>
    </label>`;
  const combatChoices = getRadioChoices(
    "combatNumber",
    ["No change", "Civilian", "10", "11", "12", "13", "14"],
    currentCombatSelection,
    "pneuma-mook-maker-radio-column",
    customCombatChoice,
  );
  const armorChoices = [
    "None",
    "Leathers",
    "Kevlar",
    "LightArmorJack",
    "MedArmorJack",
  ];
  const armorSelections = actorDocument
    ? getCurrentArmorSelections(actorDocument)
    : { body: "None", head: "None" };
  const activeRole = String(
    foundry.utils.getProperty(actor, "system.roleInfo.activeRole") ?? "",
  );
  const activeRoleKey = availableRoles.find(
    (role) => role.name.toLocaleLowerCase() === activeRole.toLocaleLowerCase(),
  )?.key ?? "none";
  const roleOptions = availableRoles.map(
    (role) =>
      `<option value="${escapeHtml(role.key)}"${activeRoleKey === role.key ? " selected" : ""}>${escapeHtml(role.name)}</option>`,
  ).join("");
  const activeRoleItem = actorDocument?.items.find(
    (item) => String(item.type) === "role" && item.name === activeRole,
  );
  const activeRoleLevel = Number(
    activeRoleItem
      ? foundry.utils.getProperty(activeRoleItem, "system.rank") ?? 0
      : 0,
  );
  const currentHitPoints = String(
    foundry.utils.getProperty(actor, "system.derivedStats.hp.value") ?? "",
  );
  const currentMove = String(
    foundry.utils.getProperty(actor, "system.stats.move.value") ?? "",
  );
  return `
    <form class="pneuma-mook-maker-form">
      <header class="pneuma-mook-maker-form-header">
        <h2>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.Header")}</h2>
      </header>
      <div class="pneuma-mook-maker-identity-row">
        <label class="pneuma-mook-maker-identity-name" for="pneuma-mook-maker-name">
          <span>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.Name")}</span>
          <input id="pneuma-mook-maker-name" name="name" type="text" value="${name}" size="25" autocomplete="off">
        </label>
        <label for="pneuma-mook-maker-role">
          <span>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.Role")}</span>
          <select id="pneuma-mook-maker-role" name="role">
            <option value="none"${activeRoleKey === "none" ? " selected" : ""}>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.None")}</option>
            ${roleOptions}
          </select>
        </label>
        <label class="pneuma-mook-maker-level" for="pneuma-mook-maker-level">
          <span>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.Level")}</span>
          <input id="pneuma-mook-maker-level" name="level" type="text" inputmode="numeric"
            pattern="[0-9]" maxlength="1" value="${activeRoleLevel}" autocomplete="off">
        </label>
      </div>
      <div class="pneuma-mook-maker-stat-grid">
        <fieldset>
          <legend>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.CombatNumber")}</legend>
          <div class="pneuma-mook-maker-combat-layout">
            <div class="pneuma-mook-maker-primary-combat-options">
              ${combatChoices}
            </div>
            <div class="pneuma-mook-maker-non-combat-pane">
              <label class="pneuma-mook-maker-non-combat-toggle">
                <input type="checkbox" name="setNonCombatSkills">
                <span>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.SetNonCombatSkills")}</span>
              </label>
              <div class="pneuma-mook-maker-non-combat-options" aria-disabled="true">
                <fieldset disabled>
                  <legend>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.SecondarySkills")}</legend>
                  ${getSkillAdjustmentOptions("secondarySkills")}
                </fieldset>
                <fieldset disabled>
                  <legend>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.TertiarySkills")}</legend>
                  ${getSkillAdjustmentOptions("tertiarySkills")}
                </fieldset>
              </div>
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.Hitpoints")}</legend>
          ${getRadioChoices("hitpoints", ["20", "25", "30", "35", "40", "45", "50"], currentHitPoints, "pneuma-mook-maker-radio-column")}
        </fieldset>
        <fieldset>
          <legend>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.Move")}</legend>
          ${getRadioChoices("move", ["2", "3", "4", "5", "6", "7", "8"], currentMove, "pneuma-mook-maker-radio-column")}
        </fieldset>
      </div>
      <div class="pneuma-mook-maker-armor-grid">
        <fieldset>
          <legend>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.BodyArmor")}</legend>
          ${getRadioChoices("bodyArmor", armorChoices, armorSelections.body, "pneuma-mook-maker-radio-column")}
        </fieldset>
        <fieldset>
          <legend>${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.HeadArmor")}</legend>
          ${getRadioChoices("headArmor", armorChoices, armorSelections.head, "pneuma-mook-maker-radio-column")}
        </fieldset>
        <p class="pneuma-mook-maker-armor-note">
          <i class="fas fa-circle-info"></i>
          ${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.ArmorInventoryNote")}
        </p>
      </div>
      <div class="pneuma-mook-maker-form-actions">
        <button type="button" data-action="apply">
          <i class="fas fa-check"></i>
          ${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.Apply")}
        </button>
        <button type="button" data-action="cancel">
          <i class="fas fa-times"></i>
          ${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.Cancel")}
        </button>
      </div>
      <hr class="pneuma-mook-maker-action-divider">
      <div class="pneuma-mook-maker-secondary-actions">
        <button class="pneuma-mook-maker-purge" type="button" data-action="purge-gear">
          <i class="fas fa-trash"></i>
          ${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.PurgeGear")}
        </button>
        <button type="button" data-action="promote">
          <i class="fas fa-user-graduate"></i>
          ${game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.Promote")}
        </button>
      </div>
    </form>`;
}

export async function showMookMakerMenu(token: Token): Promise<void> {
  const actorName = token.actor?.name ?? token.document.name;
  const initialName = token.document.name ?? token.actor?.name ?? "";
  let availableRoles: AvailableRole[];
  try {
    availableRoles = await getAvailableSystemRoles();
  } catch (error) {
    console.error("pneuma-mook-maker | Failed to discover Cyberpunk RED roles", error);
    ui.notifications?.error("MookMaker could not load roles from the Cyberpunk RED system.");
    return;
  }

  const dialog = new Dialog(
    {
      title: game.i18n!.format("PNEUMA_MOOK_MAKER.Menu.Title", { name: actorName }),
      content: getMookMakerForm(token, availableRoles),
      buttons: {},
      render: (html) => {
      const customNumber = html.find<HTMLInputElement>(
        ".pneuma-mook-maker-custom-number",
      );
      html.find<HTMLInputElement>('input[name="combatNumber"]').on("change", (event) => {
        const isCustom = (event.currentTarget as HTMLInputElement).value === "custom";
        customNumber.prop("disabled", !isCustom);
        if (isCustom) customNumber.trigger("focus");
      });
      customNumber.on("input", (event) => {
        const input = event.currentTarget as HTMLInputElement;
        input.value = input.value.replace(/\D/g, "").slice(0, 2);
        if (Number(input.value) > 20) input.value = "20";
      });
      customNumber.on("blur", (event) => {
        const input = event.currentTarget as HTMLInputElement;
        if (input.value && Number(input.value) < 8) input.value = "8";
      });
      html.find<HTMLInputElement>('#pneuma-mook-maker-level').on("input", (event) => {
        const input = event.currentTarget as HTMLInputElement;
        input.value = input.value.replace(/\D/g, "").slice(0, 1);
      });
      const nonCombatOptions = html.find(".pneuma-mook-maker-non-combat-options");
      const refreshSkillAdjustment = (): void => {
        const enabled = html
          .find<HTMLInputElement>('input[name="setNonCombatSkills"]')
          .prop("checked");
        nonCombatOptions.attr("aria-disabled", String(!enabled));
        nonCombatOptions.find("fieldset").prop("disabled", !enabled);

        for (const name of ["secondarySkills", "tertiarySkills"]) {
          html
            .find<HTMLInputElement>(`input[name="${name}Minus"]`)
            .prop("disabled", !enabled);
        }
      };
      html
        .find('input[name="setNonCombatSkills"], input[name="secondarySkills"], input[name="tertiarySkills"]')
        .on("change", refreshSkillAdjustment);
      html
        .find<HTMLInputElement>('input[name="secondarySkillsMinus"], input[name="tertiarySkillsMinus"]')
        .on("focus", (event) => {
          const input = event.currentTarget as HTMLInputElement;
          const adjustmentName = input.name.replace(/Minus$/, "");
          html
            .find<HTMLInputElement>(`input[name="${adjustmentName}"][value="minus-custom"]`)
            .prop("checked", true)
            .trigger("change");
        })
        .on("input", (event) => {
          const input = event.currentTarget as HTMLInputElement;
          input.value = input.value.replace(/\D/g, "").slice(0, 1);
          const adjustmentName = input.name.replace(/Minus$/, "");
          html
            .find<HTMLInputElement>(`input[name="${adjustmentName}"][value="minus-custom"]`)
            .prop("checked", true);
        });
      refreshSkillAdjustment();

      html.find('[data-action="apply"]').on("click", async () => {
        const applyButton = html.find<HTMLButtonElement>('[data-action="apply"]');
        if (applyButton.prop("disabled")) return;
        const newName = String(
          html.find<HTMLInputElement>('input[name="name"]').val() ?? "",
        ).trim();
        if (!newName) {
          ui.notifications?.warn(
            game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.NameRequired"),
          );
          return;
        }

        if (token.document.actorLink) {
          ui.notifications?.warn(
            game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.UnlinkedOnly"),
          );
          return;
        }

        const selectedMove = Number(
          html.find<HTMLInputElement>('input[name="move"]:checked').val(),
        );
        if (!Number.isInteger(selectedMove) || selectedMove < 2 || selectedMove > 8) {
          ui.notifications?.warn(
            game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.MoveRequired"),
          );
          return;
        }

        const selectedHitPoints = Number(
          html.find<HTMLInputElement>('input[name="hitpoints"]:checked').val(),
        );
        const hitPointStats = getStatsForHitPoints(selectedHitPoints);
        if (!hitPointStats) {
          ui.notifications?.warn(
            game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.HitpointsRequired"),
          );
          return;
        }

        const roleSelection = String(
          html.find<HTMLSelectElement>('select[name="role"]').val() ?? "none",
        );
        const selectedRole = availableRoles.find((role) => role.key === roleSelection);
        const roleName = selectedRole?.name ?? "";
        const roleLevelText = String(
          html.find<HTMLInputElement>('input[name="level"]').val() ?? "",
        );
        const roleLevel = Number(roleLevelText);
        if (roleName && (!/^\d$/.test(roleLevelText) || !Number.isInteger(roleLevel))) {
          ui.notifications?.warn(
            game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.RoleLevelRequired"),
          );
          return;
        }

        const bodyArmor = String(
          html.find<HTMLInputElement>('input[name="bodyArmor"]:checked').val() ??
            "None",
        );
        const headArmor = String(
          html.find<HTMLInputElement>('input[name="headArmor"]:checked').val() ??
            "None",
        );
        const actor = token.actor;
        if (!actor) {
          ui.notifications?.error(
            game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.ApplyFailed"),
          );
          return;
        }
        const armorResult = getArmorUpdates(actor, bodyArmor, headArmor);
        if (armorResult.missingArmor) {
          ui.notifications?.error(
            game.i18n!.format("PNEUMA_MOOK_MAKER.Form.ArmorMissing", {
              armor: armorResult.missingArmor,
            }),
          );
          return;
        }


        const combatSelection = String(
          html.find<HTMLInputElement>('input[name="combatNumber"]:checked').val() ??
            "No change",
        );
        let combatNumber: number | null = null;
        if (combatSelection === "Civilian") combatNumber = 8;
        else if (combatSelection === "custom") {
          const customCombatNumber = String(
            html.find<HTMLInputElement>('input[name="customCombatNumber"]').val() ?? "",
          );
          const customValue = Number(customCombatNumber);
          if (
            /^\d{1,2}$/.test(customCombatNumber) &&
            customValue >= 8 &&
            customValue <= 20
          ) {
            combatNumber = customValue;
          } else {
            ui.notifications?.warn(
              game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.CombatNumberRequired"),
            );
            return;
          }
        } else if (combatSelection !== "No change") {
          combatNumber = Number(combatSelection);
        }

        const skillTargets: SkillTargets = {};
        if (combatNumber !== null && Number.isFinite(combatNumber)) {
          skillTargets[1] = combatNumber;

          const setNonCombatSkills = html
            .find<HTMLInputElement>('input[name="setNonCombatSkills"]')
            .prop("checked");
          if (setNonCombatSkills) {
            for (const [category, name] of [
              [2, "secondarySkills"],
              [3, "tertiarySkills"],
            ] as const) {
              const selection = String(
                html.find<HTMLInputElement>(`input[name="${name}"]:checked`).val() ??
                  "unchanged",
              );
              const customAmount = String(
                html.find<HTMLInputElement>(`input[name="${name}Minus"]`).val() ?? "",
              );
              const target = getAdjustedSkillTarget(
                selection,
                customAmount,
                combatNumber,
              );
              if (Number.isNaN(target)) {
                ui.notifications?.warn(
                  game.i18n!.localize(
                    "PNEUMA_MOOK_MAKER.Form.SkillAdjustmentRequired",
                  ),
                );
                return;
              }
              if (target !== null) skillTargets[category] = target;
            }
          }
        }

        const skillUpdates = getSkillUpdates(
          actor,
          skillTargets,
          hitPointStats.will,
        );

        applyButton.prop("disabled", true);
        try {
          const nameChanged = await applyMookChanges({
            token,
            actor,
            initialName,
            newName,
            move: selectedMove,
            hitPoints: selectedHitPoints,
            hitPointStats,
            roleName,
            roleLevel,
            roleSource: selectedRole?.source,
            armorUpdates: armorResult.updates,
            skillUpdates,
          });
          if (nameChanged) {
            ui.notifications?.info(
              game.i18n!.format("PNEUMA_MOOK_MAKER.Form.Renamed", {
                name: newName,
              }),
            );
          }
        } catch (error) {
          ui.notifications?.error(
            game.i18n!.localize("PNEUMA_MOOK_MAKER.Form.ApplyFailed"),
          );
          applyButton.prop("disabled", false);
          return;
        }

        dialog.close();
      });
      html.find('[data-action="cancel"]').on("click", () => dialog.close());
      html.find('[data-action="purge-gear"]').on("click", () => {
        confirmPurgeGear(token);
      });
      html.find('[data-action="promote"]').on("click", () => {
        confirmPromotion(token, dialog);
      });
      },
    },
    { width: 650 },
  );
  dialog.render(true);
}
