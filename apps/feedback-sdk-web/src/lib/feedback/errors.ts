/** Customer-facing failures must not expose gateway, database or model diagnostics. */
export const feedbackUnavailable = '服务暂时不可用，请稍后重试。'
export const feedbackNetworkUnavailable = '暂时无法连接服务，请检查网络后重试。'
export const feedbackSessionExpired = '会话已失效，请关闭后重新打开帮助与反馈。'
export const feedbackNotConfigured = '帮助与反馈暂未准备好，请联系产品支持人员。'
export const feedbackUploadUnavailable = '附件上传暂时不可用，请稍后重试；也可以先用文字说明。'

const businessMessages = new Set([
  '反馈内容不能为空', '请输入问题', '消息内容不能为空', '请选择图片文件',
  '反馈不存在', '会话不存在', '附件不存在', '反馈已被删除',
  '图片像素超过40MP限制', '音频实际长度须在60秒以内',
  '图片实际格式与声明不符', '附件实际大小与声明不符', '无效图片',
  '附件尚未上传完成或无法读取', '请先确认问题信息',
])

export function feedbackResponseError(status: number, body?: unknown): Error {
  const envelope = body && typeof body === 'object' ? body as { code?: unknown; message?: unknown; error?: { message?: unknown } } : undefined
  const code = typeof envelope?.code === 'string' ? envelope.code : ''
  if (status === 401 || /SESSION.*(EXPIRED|INVALID)|UNAUTHORIZED/.test(code)) return new Error(feedbackSessionExpired)
  if (status === 403) return new Error('暂时无法访问这些内容，请重新打开；若仍有问题，请联系产品支持人员。')
  if (status === 429) return new Error('请求较多，请稍等片刻再试。')
  if (status === 413) return new Error('内容或附件过大，请缩小后重试。')
  // Only explicit, reviewed business messages may pass through. Never strip a
  // diagnostic prefix and show its remainder: it may still contain private data.
  const message = envelope?.error?.message ?? envelope?.message
  if ((status === 400 || status === 404 || status === 409 || status === 422 || status === 200) && typeof message === 'string' && businessMessages.has(message)) return new Error(message)
  if (status === 404) return new Error('暂时找不到这些内容，请刷新重试；若仍有问题，请联系产品支持人员。')
  if (status === 409) return new Error('内容已更新，请刷新后再试。')
  return new Error(feedbackUnavailable)
}

export async function feedbackFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  try { return await fetch(input, init) }
  catch { throw new Error(feedbackNetworkUnavailable) }
}

export async function readFeedbackEnvelope<T>(response: Response): Promise<T> {
  let body: unknown
  try { body = await response.json() }
  catch { throw feedbackResponseError(response.status) }
  if (!response.ok) throw feedbackResponseError(response.status, body)
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error(feedbackUnavailable)
  const envelope = body as { code?: unknown; data?: unknown }
  if ((envelope.code !== undefined && envelope.code !== 'OK' && envelope.code !== 0) || (envelope.code === undefined && !('data' in envelope))) throw feedbackResponseError(response.status, body)
  return body as T
}
