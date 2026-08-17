import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorView, LoadingView } from '@/components/ui'
import { showGlobalToast } from '@/components/ui/Toast'
import { useProject } from '@/hooks/useProjects'
import { gatewayApi } from '@/lib/api/endpoints/gateway'
import { getFeedbackProjectSetupStatus, markFeedbackProjectApiKeySetup } from '@/lib/utils/feedbackProjectSetup'
import { buildFeedbackProjectPath, decodeProjectId } from '@/lib/utils/projectRouting'
import { getAccessToken } from '@/lib/utils/tokenManager'
import type { ApiKeyInfo } from '@/types/auth'

type V2AuthMode = 'direct' | 'session'
type Platform = 'web' | 'ios' | 'android'

const SDK_URL = 'https://feedback.feitianchengzi.com/sdk-v2/index.html?embed=web'

function oneYearLaterISO() {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString()
}

function formatDateTime(value?: string): string {
  if (!value) return '未设置'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN')
}

function formatList(values?: string[]): string {
  if (!values || values.length === 0) return '全部'
  return values.join(', ')
}

async function copyText(value: string, successMessage = '已复制') {
  if (!value.trim()) {
    showGlobalToast('没有可复制的内容', 'warning', 1800)
    return
  }

  try {
    await navigator.clipboard.writeText(value)
    showGlobalToast(successMessage, 'success', 1800)
  } catch {
    showGlobalToast('复制失败，请手动复制', 'error', 2200)
  }
}

function CodeBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <button
          type="button"
          onClick={() => copyText(value, `${label}已复制`)}
          className="shrink-0 rounded-lg border border-divider bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-hover"
        >
          复制
        </button>
      </div>
      <pre className="max-h-[360px] overflow-auto rounded-lg border border-divider bg-surface p-3 text-xs leading-5 text-foreground-secondary">
        <code>{value}</code>
      </pre>
    </div>
  )
}

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white'
          : 'rounded-lg border border-divider bg-surface px-3 py-1.5 text-xs font-semibold text-foreground-secondary hover:bg-surface-hover'
      }
    >
      {children}
    </button>
  )
}

function buildWebSnippet(mode: V2AuthMode, apiKey: string, projectId: string | number) {
  if (mode === 'session') {
    return `// 由宿主服务端换取 token，浏览器不保存 Workshop API Key。
const { token } = await fetch('/api/feedback/session', {
  method: 'POST',
  credentials: 'include',
}).then((response) => response.json())

window.FeedbackSDK.configure({
  feedbackV2Enabled: true,
  feedbackV2AuthMode: 'session',
  feedbackSessionToken: token,
  gatewayUrl: 'https://api.feitianchengzi.com',
  theme: 'system',
})

window.FeedbackSDK.openSubmit()
// "我的反馈": window.FeedbackSDK.openStatus()`
  }

  return `window.FeedbackSDK.configure({
  feedbackV2Enabled: true,
  feedbackV2AuthMode: 'apiKey',
  apiKey: '${apiKey}',
  projectId: ${projectId || 0},
  customUserId: 'stable-user-or-installation-id',
  gatewayUrl: 'https://api.feitianchengzi.com',
  theme: 'system',
})

window.FeedbackSDK.openSubmit()
// "我的反馈": window.FeedbackSDK.openStatus()`
}

function buildIOSSnippet(mode: V2AuthMode, apiKey: string, projectId: string | number) {
  const config =
    mode === 'session'
      ? `"feedbackV2Enabled": true,
  "feedbackV2AuthMode": "session",
  "feedbackSessionToken": token,
  "gatewayUrl": "https://api.feitianchengzi.com"`
      : `"feedbackV2Enabled": true,
  "feedbackV2AuthMode": "apiKey",
  "apiKey": "${apiKey}",
  "projectId": ${projectId || 0},
  "customUserId": customUserId,
  "gatewayUrl": "https://api.feitianchengzi.com"`

  const preamble =
    mode === 'session'
      ? `// token 由你们自己的服务端按当前登录用户换取。
let token = try await feedbackSessionProvider.fetchToken()`
      : `let customUserId = feedbackUserStore.stableUserOrInstallationId`

  return `let configuration = WKWebViewConfiguration()
configuration.defaultWebpagePreferences.allowsContentJavaScript = true
let webView = WKWebView(frame: .zero, configuration: configuration)
webView.navigationDelegate = coordinator
webView.uiDelegate = coordinator
webView.load(URLRequest(url: URL(string: "${SDK_URL}")!))

${preamble}
let config: [String: Any] = [
  ${config},
  "theme": "system",
]
let data = try JSONSerialization.data(withJSONObject: config)
let configJSON = String(data: data, encoding: .utf8) ?? "{}"
webView.evaluateJavaScript("window.FeedbackSDK?.configure(\\(configJSON)); window.FeedbackSDK?.openSubmit();")`
}

function buildAndroidSnippet(mode: V2AuthMode, apiKey: string, projectId: string | number) {
  const config =
    mode === 'session'
      ? `feedbackV2Enabled: true,
  feedbackV2AuthMode: "session",
  feedbackSessionToken: token,
  gatewayUrl: "https://api.feitianchengzi.com"`
      : `feedbackV2Enabled: true,
  feedbackV2AuthMode: "apiKey",
  apiKey: "${apiKey}",
  projectId: ${projectId || 0},
  customUserId: customUserId,
  gatewayUrl: "https://api.feitianchengzi.com"`

  const preamble =
    mode === 'session'
      ? `val token = feedbackSessionProvider.fetchToken()`
      : `val customUserId = feedbackUserStore.stableUserOrInstallationId`

  return `webView.settings.javaScriptEnabled = true
webView.loadUrl("${SDK_URL}")

${preamble}
val script = """
window.FeedbackSDK?.configure({
  ${config},
  theme: "system",
});
window.FeedbackSDK?.openSubmit();
""".trimIndent()
webView.evaluateJavascript(script, null)`
}

const notificationEnableSnippet = `// 在 V2 configure 配置中加入。所有 V2 项目均可使用。
feedbackV2NotificationsEnabled: true,`

const unreadBadgeSnippet = `// 接入方在自己的入口渲染红点或数量；读取不会修改已读状态。
const unreadCount = await window.FeedbackSDK.getUnreadCount()
renderFeedbackBadge(unreadCount) // unreadCount 为 0 时隐藏角标`

const iframeUnreadBadgeSnippet = `const requestId = crypto.randomUUID()

iframe.contentWindow?.postMessage({
  source: 'feedback-sdk-host',
  type: 'feedback-sdk:get-unread-count',
  request_id: requestId,
}, sdkOrigin)

window.addEventListener('message', (event) => {
  if (event.origin !== sdkOrigin) return
  if (event.data?.source !== 'feedback-sdk-web') return
  if (event.data?.type !== 'feedback-sdk:unread-count') return
  if (event.data?.request_id !== requestId) return
  renderFeedbackBadge(event.data.unread_count)
})`

export default function FeedbackProjectSettingsPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams<{ id: string }>()
  const decodedProjectId = decodeProjectId(id)
  const projectId = decodedProjectId ?? ''
  const { data: project, isLoading, error, refetch } = useProject(projectId)

  const [apiKeyName, setApiKeyName] = useState('')
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [generatedApiKey, setGeneratedApiKey] = useState('')
  const [apiKeyCreatedAt, setApiKeyCreatedAt] = useState<string | undefined>(undefined)
  const [apiKeyExpiresAt, setApiKeyExpiresAt] = useState<string | undefined>(undefined)
  const [hasSetup, setHasSetup] = useState(false)
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([])
  const [apiKeysLoading, setApiKeysLoading] = useState(false)
  const [apiKeysError, setApiKeysError] = useState('')
  const [v2AuthMode, setV2AuthMode] = useState<V2AuthMode>('direct')
  const [platform, setPlatform] = useState<Platform>('web')

  useEffect(() => {
    if (!projectId) return
    setApiKeyName((prev) => prev || `feedback-sdk-project-${projectId}`)
    const setup = getFeedbackProjectSetupStatus(projectId)
    setHasSetup(setup.hasApiKeySetup)
    if (setup.createdAt) setApiKeyCreatedAt(setup.createdAt)
    if (setup.expiresAt) setApiKeyExpiresAt(setup.expiresAt)
    if (setup.apiKeyName) setApiKeyName(setup.apiKeyName)
  }, [projectId])

  const visibleApiKeys = useMemo(() => {
    return apiKeys
      .filter((item) => {
        const services = item.allowed_services || []
        return services.length === 0 || services.includes('workshop')
      })
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
  }, [apiKeys])

  const loadApiKeys = useCallback(async () => {
    if (!getAccessToken()) return
    setApiKeysLoading(true)
    setApiKeysError('')
    try {
      setApiKeys(await gatewayApi.listApiKeys())
    } catch (loadError: any) {
      setApiKeysError(loadError?.response?.data?.error?.message || loadError?.response?.data?.message || loadError?.message || '加载 API Key 列表失败')
    } finally {
      setApiKeysLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadApiKeys()
  }, [loadApiKeys])

  const handleCreateApiKey = async () => {
    if (!getAccessToken()) {
      showGlobalToast('请先登录后再创建 API Key', 'warning', 2200)
      navigate('/login')
      return
    }

    setApiKeyLoading(true)
    try {
      const response = await gatewayApi.generateApiKey({
        name: apiKeyName.trim() || `feedback-sdk-project-${projectId}`,
        expires_at: oneYearLaterISO(),
        permissions: ['read', 'write'],
        allowed_services: ['workshop'],
      })
      const apiKey = response.data?.api_key
      if (!apiKey) throw new Error('创建成功但未返回 API Key')

      setGeneratedApiKey(apiKey)
      setApiKeyCreatedAt(response.data?.created_at)
      setApiKeyExpiresAt(response.data?.expires_at)
      markFeedbackProjectApiKeySetup(projectId, {
        apiKeyName: apiKeyName.trim() || `feedback-sdk-project-${projectId}`,
        createdAt: response.data?.created_at,
        expiresAt: response.data?.expires_at,
      })
      setHasSetup(true)
      void loadApiKeys()
      showGlobalToast('API Key 创建成功，请立即复制保存', 'success', 2400)
    } catch (createError: any) {
      const message =
        createError?.response?.data?.error?.message ||
        createError?.response?.data?.message ||
        createError?.message ||
        '创建 API Key 失败'
      showGlobalToast(message, 'error', 2600)
      if (createError?.response?.status === 401) navigate('/login')
    } finally {
      setApiKeyLoading(false)
    }
  }

  const apiKeyForDocs = generatedApiKey || 'ak_xxx'
  const v2Snippet = useMemo(() => {
    if (platform === 'ios') return buildIOSSnippet(v2AuthMode, apiKeyForDocs, projectId)
    if (platform === 'android') return buildAndroidSnippet(v2AuthMode, apiKeyForDocs, projectId)
    return buildWebSnippet(v2AuthMode, apiKeyForDocs, projectId)
  }, [apiKeyForDocs, platform, projectId, v2AuthMode])

  const v1Snippet = useMemo(
    () => `window.FeedbackSDK.configure({
  apiKey: '${apiKeyForDocs}',
  projectId: ${projectId || 0},
  customUserId: 'stable-user-or-installation-id',
  theme: 'system',
})

window.FeedbackSDK.openSubmit()
// "我的反馈": window.FeedbackSDK.openStatus()`,
    [apiKeyForDocs, projectId],
  )

  const submitFeedbackCurl = useMemo(
    () => `curl -X POST "https://api.feitianchengzi.com/workshop/v1/apikey/feedbacks" \\
  -H "Authorization: Bearer ${apiKeyForDocs}" \\
  -H "Content-Type: application/json" \\
  -d '{"project_id": ${projectId || 0}, "title": "反馈标题", "content": "反馈内容", "custom_user_id": "stable-user-id"}'`,
    [apiKeyForDocs, projectId],
  )

  if (!decodedProjectId) return <ErrorView title="无效路径" message="项目标识格式不正确" />
  if (isLoading) return <LoadingView size="lg" text="加载项目设置..." />
  if (error || !project) {
    return <ErrorView title="加载失败" message="无法获取项目信息，请稍后重试" onRetry={() => refetch()} />
  }

  const platformLabel = platform === 'web' ? 'Web / WebView' : platform === 'ios' ? 'iOS' : 'Android'
  const isDirect = v2AuthMode === 'direct'

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Feedback SDK</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">接入设置 · {project.name}</h1>
          <p className="mt-1 text-sm text-foreground-secondary">V2 支持反馈会话、双向消息、附件、待办状态同步和可选未读通知。</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(buildFeedbackProjectPath(projectId))}
          className="rounded-lg border border-divider bg-surface px-3 py-2 text-sm font-semibold text-foreground-secondary hover:bg-surface-hover"
        >
          返回反馈管理
        </button>
      </header>

      <section className="border border-primary/30 bg-primary-lighter/25 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-foreground">V2 推荐接入</h2>
              <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white">当前版本</span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
              选择鉴权方式和客户端平台，复制配置后调用提交或“我的反馈”入口即可。SDK 会处理消息、附件与状态展示。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-divider bg-surface px-2.5 py-1 text-foreground-secondary">Project ID {projectId}</span>
            <button type="button" onClick={() => copyText(projectId, 'Project ID 已复制')} className="font-semibold text-primary hover:text-primary-hover">
              复制 ID
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="V2 鉴权方式">
          <TabButton active={isDirect} onClick={() => setV2AuthMode('direct')}>客户端直连</TabButton>
          <TabButton active={!isDirect} onClick={() => setV2AuthMode('session')}>宿主服务安全模式</TabButton>
        </div>

        <div className="mt-3 border-l-2 border-primary px-3 text-sm leading-6 text-foreground-secondary">
          {isDirect
            ? '适合 Web、iOS、Android 的快速接入：配置 API Key、项目 ID 和稳定用户 ID。API Key 会存在于客户端，请使用项目专用且可轮换的 Key。'
            : '适合已有服务端的产品：服务端保存 API Key 并按当前登录用户换取短期会话 token，客户端只接收 token。'}
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="V2 客户端平台">
          <TabButton active={platform === 'web'} onClick={() => setPlatform('web')}>Web / WebView</TabButton>
          <TabButton active={platform === 'ios'} onClick={() => setPlatform('ios')}>iOS</TabButton>
          <TabButton active={platform === 'android'} onClick={() => setPlatform('android')}>Android</TabButton>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <CodeBlock label={`${platformLabel} 配置`} value={v2Snippet} />
          <aside className="border border-divider bg-surface p-4 text-xs leading-5 text-foreground-secondary">
            <p className="font-semibold text-foreground">接入前确认</p>
            <ul className="mt-2 space-y-2">
              <li>使用稳定且不可猜测的 customUserId；无登录时持久化随机安装 ID。</li>
              <li>iOS / Android 使用原生 WebView，并允许 JavaScript 与文件选择。</li>
              <li>{isDirect ? '没有 API Key 时，在下方展开 API Key 管理创建。' : '会话 token 过期时，SDK 会通知宿主重新注入。'}</li>
              <li>需要入口红点时，在 V2 配置中开启下方的独立通知开关。</li>
            </ul>
          </aside>
        </div>

        {!isDirect && (
          <details className="mt-4 border border-divider bg-surface px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">服务端换取会话 token 的契约</summary>
            <p className="mt-3 text-xs leading-5 text-foreground-secondary">
              宿主服务以服务端保存的 API Key 调用 <code className="font-mono text-foreground">POST /workshop/v2/apikey/feedback-sessions</code>，传入 project_id 与当前用户的稳定 ID；把返回 token 短期转交客户端。不要把 API Key、token 写入 URL、日志或本地持久化。
            </p>
          </details>
        )}

        <details className="mt-4 border border-divider bg-surface px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">通知与入口角标（V2 可选能力）</summary>
          <p className="mt-3 text-xs leading-5 text-foreground-secondary">
            入口的红点或数字由你的 App、网站或原生导航渲染；SDK 只返回当前用户的未读数。所有 V2 项目均可开启；不开启不会影响提交反馈或会话能力。
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <CodeBlock label="在现有 V2 配置中开启通知" value={notificationEnableSnippet} />
            <CodeBlock label="WebView / 同页 SDK 读取未读数" value={unreadBadgeSnippet} />
          </div>
          <details className="mt-4 border-t border-divider pt-4">
            <summary className="cursor-pointer text-xs font-semibold text-foreground">跨域 iframe 读取未读数</summary>
            <p className="mt-2 text-xs leading-5 text-foreground-secondary">
              iframe 不能直接访问 SDK 的全局对象，使用请求 ID 匹配异步返回。SDK 在状态页加载或读完会话后也会主动发送 <code className="font-mono text-foreground">feedback-sdk:unread-changed</code>，可用于刷新入口角标。
            </p>
            <div className="mt-3"><CodeBlock label="iframe 未读数协议" value={iframeUnreadBadgeSnippet} /></div>
          </details>
        </details>
      </section>

      <details className="border border-divider bg-surface-elevated p-4" open={!hasSetup}>
        <summary className="cursor-pointer text-sm font-semibold text-foreground">API Key 管理</summary>
        <p className="mt-2 text-xs leading-5 text-foreground-secondary">
          直连模式需要 API Key；安全模式只由宿主服务端使用。创建后的明文只显示一次，请立即保存。
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            value={apiKeyName}
            onChange={(event) => setApiKeyName(event.target.value)}
            placeholder={`feedback-sdk-project-${projectId}`}
            className="rounded-lg border border-divider bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={handleCreateApiKey}
            disabled={apiKeyLoading || !apiKeyName.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {apiKeyLoading ? '创建中...' : '创建 API Key'}
          </button>
          <button
            type="button"
            onClick={() => copyText(generatedApiKey, 'API Key 已复制')}
            disabled={!generatedApiKey}
            className="rounded-lg border border-divider bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            复制 API Key
          </button>
        </div>

        <textarea
          value={generatedApiKey}
          readOnly
          rows={3}
          placeholder="创建后显示，已有 Key 的明文不会再次返回。"
          className="mt-3 w-full rounded-lg border border-divider bg-surface px-3 py-2 font-mono text-xs text-foreground placeholder:text-foreground-tertiary focus:outline-none"
        />
        <div className="mt-3 text-xs leading-5 text-foreground-secondary">
          创建时间：{formatDateTime(apiKeyCreatedAt)}　过期时间：{formatDateTime(apiKeyExpiresAt)}　允许服务：workshop
        </div>

        <details className="mt-4 border-t border-divider pt-4">
          <summary className="cursor-pointer text-xs font-semibold text-foreground">查看已有 API Key</summary>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={loadApiKeys}
              disabled={apiKeysLoading}
              className="rounded-lg border border-divider bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {apiKeysLoading ? '刷新中...' : '刷新列表'}
            </button>
          </div>
          {apiKeysError ? <div className="mt-3 bg-error-lighter px-3 py-2 text-xs text-error">{apiKeysError}</div> : null}
          <div className="mt-3 overflow-x-auto border border-divider">
            <table className="min-w-full divide-y divide-divider text-left text-xs">
              <thead className="bg-surface">
                <tr className="text-foreground-tertiary">
                  <th className="px-3 py-2 font-semibold">名称</th>
                  <th className="px-3 py-2 font-semibold">状态</th>
                  <th className="px-3 py-2 font-semibold">权限</th>
                  <th className="px-3 py-2 font-semibold">创建时间</th>
                  <th className="px-3 py-2 font-semibold">过期时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider bg-surface-elevated">
                {visibleApiKeys.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-5 text-center text-foreground-tertiary">{apiKeysLoading ? '正在加载...' : '暂无 workshop API Key'}</td></tr>
                ) : (
                  visibleApiKeys.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="max-w-[260px] px-3 py-2"><div className="truncate font-semibold text-foreground">{item.name || '未命名 Key'}</div><div className="mt-1 font-mono text-[11px] text-foreground-tertiary">ID: {item.id}</div></td>
                      <td className="px-3 py-2"><span className={item.is_active === false ? 'text-error' : 'text-success'}>{item.is_active === false ? '已停用' : '可用'}</span></td>
                      <td className="px-3 py-2 text-foreground-secondary">{formatList(item.permissions)}</td>
                      <td className="px-3 py-2 text-foreground-secondary">{formatDateTime(item.created_at)}</td>
                      <td className="px-3 py-2 text-foreground-secondary">{formatDateTime(item.expires_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </details>
      </details>

      <details className="border border-divider bg-surface-elevated p-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">V1 历史兼容接入</summary>
        <p className="mt-2 text-xs leading-5 text-foreground-secondary">
          已上线的 V1 SDK、iOS 和待办 Web 可继续使用，不需要迁移。新接入优先使用 V2；只有需要维持旧能力时再展开本区。
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <CodeBlock label="V1 最短配置" value={v1Snippet} />
          <div className="border border-divider bg-surface p-4 text-xs leading-5 text-foreground-secondary">
            <p className="font-semibold text-foreground">V1 能力边界</p>
            <p className="mt-2">提交反馈、查看状态和基础附件仍可用；双向消息、消息级附件与更细粒度会话鉴权属于 V2。</p>
          </div>
        </div>
        <details className="mt-4 border-t border-divider pt-4">
          <summary className="cursor-pointer text-xs font-semibold text-foreground">V1 服务端调试接口</summary>
          <div className="mt-3"><CodeBlock label="提交反馈" value={submitFeedbackCurl} /></div>
        </details>
      </details>
    </div>
  )
}
