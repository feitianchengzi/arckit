import { useEffect, useState } from 'react'
import { SDKSupportPage } from '@/pages/SDKSupportPage'
import { FEEDBACK_SDK_CONFIGURED_EVENT, isFeedbackSDKV3Enabled } from '@/lib/sdk'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { SDKStatusPage } from '@/pages/SDKStatusPage'
import { SDKSubmitPage } from '@/pages/SDKSubmitPage'
import { SDKChatPage } from '@/pages/SDKChatPage'

function RedirectToSubmit() {
  const location = useLocation()
  return <Navigate to={{ pathname: '/submit', search: location.search }} replace />
}

export default function App() {
  const [v3, setV3] = useState(isFeedbackSDKV3Enabled())
  useEffect(() => {
    const configured = () => setV3(isFeedbackSDKV3Enabled())
    window.addEventListener(FEEDBACK_SDK_CONFIGURED_EVENT, configured)
    return () => window.removeEventListener(FEEDBACK_SDK_CONFIGURED_EVENT, configured)
  }, [])
  if (v3) return <SDKSupportPage />
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
