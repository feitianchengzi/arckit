'use client'

/**
 * 注册页面
 * 重定向到登录页（新流程不需要独立注册）
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    // 重定向到登录页
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-gray-600">跳转到登录页...</p>
      </div>
    </div>
  )
}
