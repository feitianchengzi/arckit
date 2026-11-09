import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MessageContent } from './MessageContent'

describe('chat Markdown', () => {
 it('renders headings, emphasis, lists and code without executing HTML', () => {
  const { container } = render(<MessageContent markdown content={'## 功能\n\n**自动化**\n\n- 支持 `Loop`\n\n[说明](https://example.com)\n\n<script>alert(1)</script>\n\n[危险](javascript:alert(1))'} />)
  expect(screen.getByRole('heading', { name: '功能', level: 2 })).toBeInTheDocument()
  expect(container.querySelector('strong')).toHaveTextContent('自动化')
  expect(container.querySelector('li code')).toHaveTextContent('Loop')
  expect(container.textContent).not.toContain('**')
  expect(container.querySelector('script')).toBeNull()
  expect(screen.getByText('危险').getAttribute('href')).not.toMatch(/^javascript:/)
  expect(screen.getByRole('link', { name: '说明' })).toHaveAttribute('rel', 'noopener noreferrer')
 })
 it('preserves customer text literally', () => {
  const { container } = render(<MessageContent markdown={false} content="**原始输入**" />)
  expect(screen.getByText('**原始输入**')).toBeInTheDocument()
  expect(container.querySelector('strong')).toBeNull()
 })
})
