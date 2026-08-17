interface ProjectSetupStatus {
  hasApiKeySetup: boolean
  apiKeyName?: string
  createdAt?: string
  expiresAt?: string
}

const STORAGE_PREFIX = 'feedback_project_setup_v1_'

const buildStorageKey = (projectId: string | number) => `${STORAGE_PREFIX}${projectId}`

export function getFeedbackProjectSetupStatus(projectId: string | number): ProjectSetupStatus {
  if (typeof window === 'undefined') {
    return { hasApiKeySetup: false }
  }

  try {
    const raw = localStorage.getItem(buildStorageKey(projectId))
    if (!raw) {
      return { hasApiKeySetup: false }
    }

    const parsed = JSON.parse(raw) as ProjectSetupStatus
    return {
      hasApiKeySetup: !!parsed.hasApiKeySetup,
      apiKeyName: parsed.apiKeyName,
      createdAt: parsed.createdAt,
      expiresAt: parsed.expiresAt,
    }
  } catch {
    return { hasApiKeySetup: false }
  }
}

export function markFeedbackProjectApiKeySetup(
  projectId: string | number,
  payload: {
    apiKeyName: string
    createdAt?: string
    expiresAt?: string
  }
) {
  if (typeof window === 'undefined') return

  const next: ProjectSetupStatus = {
    hasApiKeySetup: true,
    apiKeyName: payload.apiKeyName,
    createdAt: payload.createdAt,
    expiresAt: payload.expiresAt,
  }

  try {
    localStorage.setItem(buildStorageKey(projectId), JSON.stringify(next))
  } catch {
    // 忽略本地存储写入失败，不阻塞主流程
  }
}

