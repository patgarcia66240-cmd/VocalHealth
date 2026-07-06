/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORAGE_MODE?: "local" | "turso";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
