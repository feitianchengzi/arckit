'use client'

import { Button, TextField, Label, LoadingView, ErrorView, EmptyStateView } from '@/components/ui'

export default function TestComponentsPage() {
  return (
    <div className="container mx-auto p-8 space-y-12">
      <h1 className="text-3xl font-bold">组件测试页面</h1>
      
      {/* Button */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Button</h2>
        <div className="flex gap-4 flex-wrap">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
        <div className="flex gap-4 flex-wrap">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
        <div className="flex gap-4 flex-wrap">
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>
      
      {/* TextField */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">TextField</h2>
        <div className="max-w-md space-y-4">
          <TextField
            id="username"
            label="用户名"
            placeholder="请输入用户名"
            required
          />
          <TextField
            id="email"
            label="邮箱"
            type="email"
            placeholder="请输入邮箱"
            helperText="我们不会分享您的邮箱"
          />
          <TextField
            id="password"
            label="密码"
            type="password"
            placeholder="请输入密码"
            error="密码长度不能少于 6 位"
          />
          <TextField
            id="disabled"
            label="禁用状态"
            disabled
            value="不可编辑"
          />
        </div>
      </section>
      
      {/* Label */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Label</h2>
        <div className="space-y-2">
          <Label size="sm">Small Label</Label>
          <Label size="md">Medium Label</Label>
          <Label size="lg" required>Large Label (Required)</Label>
        </div>
      </section>
      
      {/* LoadingView */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">LoadingView</h2>
        <div className="border rounded-lg p-4">
          <LoadingView size="md" text="加载中..." />
        </div>
      </section>
      
      {/* ErrorView */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">ErrorView</h2>
        <div className="border rounded-lg p-4">
          <ErrorView
            title="加载失败"
            message="无法连接到服务器"
            onRetry={() => alert('重试')}
          />
        </div>
      </section>
      
      {/* EmptyStateView */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">EmptyStateView</h2>
        <div className="border rounded-lg p-4">
          <EmptyStateView
            title="暂无项目"
            message="创建第一个项目开始使用"
            actionLabel="创建项目"
            onAction={() => alert('创建项目')}
          />
        </div>
      </section>
    </div>
  )
}

