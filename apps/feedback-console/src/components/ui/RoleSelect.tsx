'use client'

/**
 * RoleSelect - 角色选择器组件
 */

import { useState } from 'react'
import clsx from 'clsx'
import type { ProjectRole } from '@/types'

export interface RoleSelectProps {
  value: ProjectRole
  onChange: (role: ProjectRole) => void
  disabled?: boolean
}

const ROLES: { value: ProjectRole; label: string; description: string }[] = [
  {
    value: 'member',
    label: '成员',
    description: '可以查看和编辑任务',
  },
  {
    value: 'admin',
    label: '管理员',
    description: '可以管理项目和成员',
  },
]

export function RoleSelect({ value, onChange, disabled = false }: RoleSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const selectedRole = ROLES.find(r => r.value === value) || ROLES[0]
  
  return (
    <div className="relative">
      {/* 选择按钮 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'w-full px-4 py-3 text-left',
          'border border-border rounded-md',
          'hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary',
          'transition-colors',
          'disabled:bg-surface-disabled disabled:cursor-not-allowed'
        )}
        style={{ backgroundColor: 'var(--color-surface-elevated)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {selectedRole.label}
            </p>
            <p className="text-xs text-foreground-secondary">
              {selectedRole.description}
            </p>
          </div>
          
          <ChevronIcon
            className={clsx(
              'w-5 h-5 text-foreground-tertiary transition-transform',
              { 'transform rotate-180': isOpen }
            )}
          />
        </div>
      </button>
      
      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 选项列表 */}
          <div 
            className="absolute z-20 w-full mt-1 border border-border rounded-md shadow-lg"
            style={{ backgroundColor: 'var(--color-surface-elevated)' }}
          >
            {ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => {
                  onChange(role.value)
                  setIsOpen(false)
                }}
                className={clsx(
                  'w-full px-4 py-3 text-left',
                  'hover:bg-surface-hover transition-colors',
                  {
                    'bg-primary-light': role.value === value,
                  }
                )}
              >
                <p className="text-sm font-medium text-foreground">
                  {role.label}
                </p>
                <p className="text-xs text-foreground-secondary">
                  {role.description}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ==================== 图标组件 ====================

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}



