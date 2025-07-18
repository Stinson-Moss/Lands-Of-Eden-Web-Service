/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_LINK: string;
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}