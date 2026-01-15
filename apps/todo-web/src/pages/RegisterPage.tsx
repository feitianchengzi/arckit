/**
 * 注册页面 - 重定向到登录页
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // 重定向到登录页
    navigate('/login', { replace: true })
  }, [navigate])

  // 返回一个空的或者带 Loading 的界面
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
}
