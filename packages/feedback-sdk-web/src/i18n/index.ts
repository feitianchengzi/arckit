import { zhCN, type TranslationKey } from './zh-CN'
import { enUS } from './en-US'

export type FeedbackSDKLocale = 'zh-CN' | 'en-US'

const dictionaries: Record<FeedbackSDKLocale, Record<TranslationKey, string>> = {
  'zh-CN': zhCN as unknown as Record<TranslationKey, string>,
  'en-US': enUS,
}

// 默认 zh-CN；宿主通过 configure({ locale }) 或 window.FeedbackSDK.setLocale() 切换。
// 不在模块加载期读取 config，避免与配置模块的加载顺序耦合。
let currentLocale: FeedbackSDKLocale = 'zh-CN'

export function getLocale(): FeedbackSDKLocale {
  return currentLocale
}

export function setLocale(locale: FeedbackSDKLocale) {
  if (locale === 'zh-CN' || locale === 'en-US') {
    currentLocale = locale
  }
}

// 仅供测试复位使用
export function resetLocale() {
  currentLocale = 'zh-CN'
}

// 轻量翻译：支持 {name} 形式的参数插值；缺失 key 时回退到 key 本身。
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = dictionaries[currentLocale] || dictionaries['zh-CN']
  let value = dict[key as TranslationKey]
  if (value === undefined) return key
  if (params) {
    for (const [name, val] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${name}\\}`, 'g'), String(val))
    }
  }
  return value
}
