import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { productContract } = vi.hoisted(() => ({ productContract: { v3: false, checks: [] as boolean[] } }))

vi.mock('@/lib/sdk', () => ({
  FEEDBACK_SDK_CONFIGURED_EVENT: 'feedback-sdk:configured',
  isFeedbackSDKV3Enabled: () => productContract.checks.length ? productContract.checks.shift()! : productContract.v3,
}))
vi.mock('@/pages/SDKSupportPage', () => ({ SDKSupportPage: () => <p>V3_SUPPORT</p> }))
vi.mock('@/pages/SDKSubmitPage', () => ({ SDKSubmitPage: () => <p>V2_SUBMIT</p> }))
vi.mock('@/pages/SDKStatusPage', () => ({ SDKStatusPage: () => <p>V2_STATUS</p> }))

import App from './App'

beforeEach(() => {
  productContract.v3 = false
  productContract.checks = []
})

describe('SDK product contract routing', () => {
  it('keeps the assistant route out of the V2 product', () => {
    render(<MemoryRouter initialEntries={['/chat?feedback=12']}><App /></MemoryRouter>)

    expect(screen.getByText('V2_STATUS')).toBeInTheDocument()
    expect(screen.queryByText('V3_SUPPORT')).not.toBeInTheDocument()
  })

  it('preserves the unified support surface for an explicit V3 build', () => {
    productContract.v3 = true
    render(<MemoryRouter initialEntries={['/chat?feedback=12']}><App /></MemoryRouter>)

    expect(screen.getByText('V3_SUPPORT')).toBeInTheDocument()
    expect(screen.queryByText('V2_STATUS')).not.toBeInTheDocument()
  })

  it('reconciles V3 configuration that completed before the React listener mounted', () => {
    productContract.checks = [false, true]
    render(<MemoryRouter initialEntries={['/submit']}><App /></MemoryRouter>)

    expect(screen.getByText('V3_SUPPORT')).toBeInTheDocument()
    expect(screen.queryByText('V2_SUBMIT')).not.toBeInTheDocument()
  })
})
