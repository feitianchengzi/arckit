function isHexChar(char: string): boolean {
  return /^[0-9A-Fa-f]$/.test(char)
}

function isHexByteAt(text: string, index: number): boolean {
  return (
    text[index] === '%' &&
    index + 2 < text.length &&
    isHexChar(text[index + 1]) &&
    isHexChar(text[index + 2])
  )
}

function parseHexByte(text: string, index: number): number {
  return parseInt(text.slice(index + 1, index + 3), 16)
}

/**
 * Decode percent-encoded non-ASCII bytes for display while keeping ASCII escapes
 * (for example %20) unchanged, matching browser-like URL display better.
 */
export function decodeUrlForDisplay(url: string): string {
  if (!url) return url
  if (!/%[0-9A-Fa-f]{2}/.test(url)) return url

  let out = ''
  let i = 0

  while (i < url.length) {
    if (!isHexByteAt(url, i)) {
      out += url[i]
      i += 1
      continue
    }

    const firstByte = parseHexByte(url, i)

    // Keep ASCII percent-escapes as-is, such as %20.
    if (firstByte < 0x80) {
      out += url.slice(i, i + 3)
      i += 3
      continue
    }

    // Decode a contiguous non-ASCII percent-encoded run.
    let j = i
    while (isHexByteAt(url, j) && parseHexByte(url, j) >= 0x80) {
      j += 3
    }

    const encodedRun = url.slice(i, j)
    try {
      out += decodeURIComponent(encodedRun)
      i = j
    } catch {
      out += url.slice(i, i + 3)
      i += 3
    }
  }

  return out
}

const URL_TEXT_PATTERN = /((?:https?:\/\/|www\.)[^\s<>"'`)\]]+)/g

/**
 * Decode visible URL text in a sentence while keeping non-URL text untouched.
 */
export function decodeUrlsInTextForDisplay(text: string): string {
  if (!text) return text
  return text.replace(URL_TEXT_PATTERN, (rawUrl) => decodeUrlForDisplay(rawUrl))
}
