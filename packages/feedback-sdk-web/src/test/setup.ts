import '@testing-library/jest-dom/vitest'
import { vi, afterEach } from 'vitest'

// jsdom 不实现 matchMedia / scrollTo，组件与 hooks 依赖时回退到空实现。
if (!window.matchMedia) {
  // @ts-ignore test shim
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}

// Element.scrollTo / scrollIntoView 在 jsdom 中为空操作，避免自动滚动逻辑报错。
if (!Element.prototype.scrollTo) {
  // @ts-ignore test shim
  Element.prototype.scrollTo = () => {}
}
if (!Element.prototype.scrollIntoView) {
  // @ts-ignore test shim
  Element.prototype.scrollIntoView = () => {}
}

// 默认 fetch / WebSocket 占位，单测按需覆盖。
const noopFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
if (!globalThis.fetch) {
  // @ts-ignore test shim
  globalThis.fetch = noopFetch
}

afterEach(() => {
  vi.restoreAllMocks()
})
