export type StorageMode = "local" | "turso";

function normalizeStorageMode(value: string | undefined): StorageMode {
  return value === "turso" ? "turso" : "local";
}

export const clientStorageMode = normalizeStorageMode(import.meta.env.VITE_STORAGE_MODE);

export function isCloudStorageEnabled() {
  return clientStorageMode === "turso";
}
