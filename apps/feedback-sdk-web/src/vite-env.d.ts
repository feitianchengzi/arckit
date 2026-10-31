/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GATEWAY_URL?: string
  readonly VITE_PUBLIC_BASE?: string
  readonly VITE_SDK_VERSION?: string
  readonly VITE_BUILD_ID?: string
  readonly VITE_SDK_SUPPORTED_CONTRACTS?: string
  readonly VITE_SDK_CONTRACT?: 'v1' | 'v2' | 'v3'
  readonly VITE_SDK_FEEDBACK_API_KEY?: string
  readonly VITE_SDK_FEEDBACK_PROJECT_ID?: string
  readonly VITE_SDK_PARENT_ORIGIN?: string
  readonly VITE_SDK_PARENT_ORIGINS?: string
  readonly VITE_SDK_FEEDBACK_V2_NOTIFICATIONS_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
