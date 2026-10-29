import { useEffect, useState } from 'react'
import { SDKSupportPage } from '@/pages/SDKSupportPage'
import { FEEDBACK_SDK_CONFIGURED_EVENT, isFeedbackSDKV2Enabled } from '@/lib/sdk'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { SDKStatusPage } from '@/pages/SDKStatusPage'
import { SDKSubmitPage } from '@/pages/SDKSubmitPage'
import { SDKChatPage } from '@/pages/SDKChatPage'

function RedirectToSubmit() {
  const location = useLocation()
  return <Navigate to={{ pathname: '/submit', search: location.search }} replace />
}

export default function App() {
  const [v2, setV2] = useState(isFeedbackSDKV2Enabled())
  useEffect(() => { const configured = () => setV2(isFeedbackSDKV2Enabled()); window.addEventListener(FEEDBACK_SDK_CONFIGURED_EVENT, configured); return () => window.removeEventListener(FEEDBACK_SDK_CONFIGURED_EVENT, configured) }, [])
  if (v2) return <SDKSupportPage />
  return (
    <Routes>
      <Route path="/" element={<RedirectToSubmit />} />
      <Route path="/index.html" element={<RedirectToSubmit />} />
      <Route path="/submit" element={<SDKSubmitPage />} />
      <Route path="/chat" element={<SDKChatPage />} />
      <Route path="/status" element={<SDKStatusPage />} />
      <Route path="*" element={<RedirectToSubmit />} />
    </Routes>
  )
}
