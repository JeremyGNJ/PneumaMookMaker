export const MODULE_ID = "pneuma-mook-maker" as const;
export const SUPPORTED_SYSTEM_ID = "cyberpunk-red-core" as const;

export const FOLDER_NAMES = {
  root: "MookMaker",
  templates: "Templates",
  promoted: "Promoted",
} as const;

export const CREATED_BY_MOOK_MAKER_FLAG = "CreatedByMookMaker" as const;
export const PROMOTED_FROM_MOOK_MAKER_FLAG = "PromotedFromMookMaker" as const;
export const DEFAULT_MOOK_TEMPLATE_FLAG = "IsDefaultMookTemplate" as const;
export const DEFAULT_MOOK_TEMPLATE_VERSION_FLAG = "DefaultMookTemplateVersion" as const;
export const DEFAULT_MOOK_TEMPLATE_VERSION = 1 as const;
export const FOLDER_KIND_FLAG = "FolderKind" as const;
