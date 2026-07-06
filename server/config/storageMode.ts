export type StorageMode = "local" | "turso";

export function getStorageMode(): StorageMode {
  return process.env.APP_STORAGE_MODE === "turso" ? "turso" : "local";
}

export function isTursoStorageMode() {
  return getStorageMode() === "turso";
}
