import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FeedbackShell } from './FeedbackShell'

describe('FeedbackShell embedded dismissal boundary', () => {
  const originalParent = window.parent
  const postMessage = vi.fn()

  beforeEach(() => {
    document.documentElement.dataset.feedbackEmbed = 'web'
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage },
    })
  })

  afterEach(() => {
    delete document.documentElement.dataset.feedbackEmbed
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    })
    postMessage.mockReset()
  })

  it('keeps blank iframe space inert and only closes from the explicit button', () => {
    render(
      <div data-testid="iframe-viewport">
        <FeedbackShell mode="embed">
          <p>反馈内容</p>
        </FeedbackShell>
      </div>,
    )

    fireEvent.pointerDown(screen.getByTestId('iframe-viewport'))
    fireEvent.click(screen.getByTestId('iframe-viewport'))
    expect(postMessage).not.toHaveBeenCalled()

    const close = document.querySelector<HTMLButtonElement>('[data-feedback-sdk-shell] > button')
    expect(close).not.toBeNull()
    fireEvent.click(close!)
    expect(postMessage).toHaveBeenCalledTimes(1)
    expect(postMessage).toHaveBeenCalledWith(
      { source: 'feedback-sdk-web', type: 'feedback-sdk:close' },
      '*',
    )
  })
})
