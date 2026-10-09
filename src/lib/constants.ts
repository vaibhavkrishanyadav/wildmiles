export const STORAGE_KEYS = {
  TOTAL_XP: "wildmiles_total_xp",
  COMPLETED_QUESTS: "wildmiles_completed_quests",
  VERIFIED_PHOTOS: "wildmiles_verified_photos",
} as const;

export const GPS_CONFIG = {
  MAX_ACCURACY_METERS: 30,
  MIN_MOVEMENT_METERS: 5,
  MAX_SPEED_METERS_PER_SECOND: 10,
  GEOLOCATION_TIMEOUT_MS: 15000,
} as const;
