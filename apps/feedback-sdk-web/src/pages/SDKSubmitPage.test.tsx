import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { submitFeedbackV2 } from '@/lib/feedback/v2'
import { SDKSubmitPage } from './SDKSubmitPage'

vi.mock('@/lib/feedback/v2', () => ({ submitFeedbackV2: vi.fn() }))
vi.mock('@/lib/feedback/api', () => ({
  getOrPersistApiKey: vi.fn(),
  getOrPersistCustomUserId: vi.fn(),
  resolveProjectId: vi.fn(),
  submitFeedbackByApiKey: vi.fn(),
}))
vi.mock('@/lib/feedback/upload', () => ({
  uploadFeedbackImageByApiKey: vi.fn(),
  uploadFeedbackImageV2: vi.fn(),
}))
vi.mock('@/lib/sdk', () => ({
  FEEDBACK_SDK_CONFIGURED_EVENT: 'feedback-sdk:configured',
  FEEDBACK_SDK_NATIVE_IMAGE_EVENT: 'feedback-sdk:native-image',
  getFeedbackSDKConfig: () => ({ feedbackV2Enabled: true }),
}))

function mount() {
  return render(
    <MemoryRouter initialEntries={['/submit?embed=web']}>
      <Routes>
        <Route path="/submit" element={<SDKSubmitPage />} />
        <Route path="/status" element={<p>MY_FEEDBACK</p>} />
        <Route path="/chat" element={<p>SMART_CHAT</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(submitFeedbackV2).mockResolvedValue({ id: 12, shortId: 'FB-12' })
})

describe('V2 feedback submission', () => {
  it('does not render the smart assistant entry', () => {
    mount()

    expect(screen.queryByText('智能客服')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '开始对话' })).not.toBeInTheDocument()
  })

  it('opens My Feedback after submission without entering smart chat', async () => {
    mount()
    fireEvent.change(screen.getByLabelText('反馈内容'), { target: { value: 'V2 提交后不应进入智能客服' } })
    fireEvent.click(screen.getByRole('button', { name: '提交反馈' }))

    await waitFor(() => expect(screen.getByText('MY_FEEDBACK')).toBeInTheDocument())
    expect(screen.queryByText('SMART_CHAT')).not.toBeInTheDocument()
    expect(submitFeedbackV2).toHaveBeenCalledWith({
      content: 'V2 提交后不应进入智能客服',
      attachments: [],
    })
  })
})
