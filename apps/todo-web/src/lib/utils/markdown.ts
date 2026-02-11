export function normalizeMarkdown(content: string): string {
  if (!content) return content

  const lines = content.split(/\r?\n/)
  let inCodeBlock = false
  let indentBullets = false

  const normalizedLines = lines.map((line) => {
    const trimmed = line.trim()
    const isFence = trimmed.startsWith('```') || trimmed.startsWith('~~~')

    if (isFence) {
      inCodeBlock = !inCodeBlock
      return line
    }

    if (inCodeBlock) {
      return line
    }

    const numberedMatch = trimmed.match(/^(\d+)、\s*/)
    if (numberedMatch) {
      indentBullets = true
      const indent = line.match(/^\s*/)?.[0] ?? ''
      const rest = trimmed.replace(/^(\d+)、\s*/, `${numberedMatch[1]}. `)
      return `${indent}${rest}`
    }

    if (!trimmed) {
      indentBullets = false
      return line
    }

    if (/^[-*+]\s+/.test(trimmed) && indentBullets) {
      if (/^\s+[-*+]\s+/.test(line)) {
        return line
      }
      return `  ${line}`
    }

    indentBullets = false
    return line
  })

  return normalizedLines.join('\n')
}
