import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { SDKStatusPage } from '@/pages/SDKStatusPage'
import { SDKSubmitPage } from '@/pages/SDKSubmitPage'

function RedirectToSubmit() {
  const location = useLocation()
  return <Navigate to={{ pathname: '/submit', search: location.search }} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RedirectToSubmit />} />
      <Route path="/index.html" element={<RedirectToSubmit />} />
      <Route path="/submit" element={<SDKSubmitPage />} />
      <Route path="/status" element={<SDKStatusPage />} />
      <Route path="*" element={<RedirectToSubmit />} />
    </Routes>
  )
}
