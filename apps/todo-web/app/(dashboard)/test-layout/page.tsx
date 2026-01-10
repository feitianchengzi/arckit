'use client'

import { Button } from '@/components/ui'

export default function TestLayoutPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">布局测试页面</h1>
        <p className="mt-2 text-gray-600">测试 Sidebar 和 MainLayout 是否正常工作</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold">测试内容</h2>
        
        <div className="space-y-2">
          <p>✅ Sidebar 应该在左侧显示</p>
          <p>✅ 用户信息应该在 Sidebar 顶部</p>
          <p>✅ 导航菜单应该可以点击</p>
          <p>✅ 主内容区域应该可以滚动</p>
        </div>
        
        <div className="flex gap-4">
          <Button variant="primary">主要按钮</Button>
          <Button variant="secondary">次要按钮</Button>
        </div>
      </div>
      
      {/* 测试滚动 */}
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold">测试卡片 {i + 1}</h3>
            <p className="text-gray-600 mt-2">这是用来测试滚动的卡片内容</p>
          </div>
        ))}
      </div>
    </div>
  )
}
