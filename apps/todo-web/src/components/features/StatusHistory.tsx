'use client'

/**
 * StatusHistory - 状态历史时间线组件
 */

import { StatusBadge } from '@/components/ui'
import type { TaskHistory } from '@/types'
import { stateToStatus } from '@/lib/utils/taskMapper'

export interface StatusHistoryProps {
  history: TaskHistory[]
  className?: string
  lastUpdatedAt?: string // 最后更新时间
}

export function StatusHistory({ history, className, lastUpdatedAt }: StatusHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <div className={className}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">状态历史</h3>
        {lastUpdatedAt && (
          <p className="text-sm text-gray-500">
            最后一次更新于 {new Date(lastUpdatedAt).toLocaleString('zh-CN')}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        状态历史 ({history.length})
      </h3>
      
      <div className="space-y-4">
        {history.map((item, index) => (
          <div key={item.id} className="relative pl-8 pb-4">
            {/* 时间线 */}
            {index < history.length - 1 && (
              <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-200" />
            )}
            
            {/* 时间点 */}
            <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-primary border-2 border-white" />
            
            {/* 内容 */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <StatusBadge status={stateToStatus(item.old_state)} size="sm" />
                <ArrowIcon className="w-4 h-4 text-gray-400" />
                <StatusBadge status={stateToStatus(item.new_state)} size="sm" />
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  {item.operator?.username || '未知用户'} 于{' '}
                  {new Date(item.changed_at).toLocaleString('zh-CN')} 变更
                </p>
              </div>
            </div>
          </div>
        ))}
        {lastUpdatedAt && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              最后一次更新于 {new Date(lastUpdatedAt).toLocaleString('zh-CN')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== 图标组件 ====================

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}



