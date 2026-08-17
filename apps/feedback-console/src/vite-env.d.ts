/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_GATEWAY_URL?: string
  readonly VITE_FEEDBACK_SDK_URL?: string
  readonly VITE_FEEDBACK_SDK_API_KEY?: string
  readonly VITE_FEEDBACK_SDK_PROJECT_ID?: string
  readonly VITE_FEEDBACK_V2_PROJECT_IDS?: string
  readonly VITE_WORKSHOP_V2_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
