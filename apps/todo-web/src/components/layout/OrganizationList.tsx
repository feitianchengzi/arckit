'use client'

/**
 * OrganizationList - Sidebar 组织列表组件
 * 
 * 功能：
 * 1. 显示组织列表
 * 2. 点击组织跳转到组织详情
 * 3. 最多显示3个组织，超出显示"显示更多"
 */

import { useNavigate, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { useOrganizationList } from '@/hooks/useOrganizations'
import { useState } from 'react'

interface OrganizationListProps {
  onItemClick?: (href: string) => void // 点击组织项的回调
}

interface Organization {
  id: number
  name: string
  description?: string
  creator_id: number
  created_at: string
  updated_at?: string
  deleted_at?: string
}

export function OrganizationList({ onItemClick }: OrganizationListProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const { data: organizations = [], isLoading } = useOrganizationList()
  const [showAll, setShowAll] = useState(false)

  // 获取当前选中的组织 ID
  const currentOrganizationId = pathname?.match(/\/organizations\/(\d+)/)?.[1]

  // 控制显示的组织数量，最多显示3个，除非用户点击"显示更多"
  const displayedOrganizations = showAll ? organizations : organizations.slice(0, 3)
  const hasMore = organizations.length > 3

  const handleOrganizationClick = (organizationId: number) => {
    const href = `/organizations/${organizationId}`
    if (onItemClick) {
      onItemClick(href)
    } else {
      navigate(href)
    }
  }

  const handleShowMore = () => {
    setShowAll(!showAll)
  }

  return (
    <div className="space-y-1">
      {isLoading ? (
        <div className="px-3 py-2 flex items-center gap-2">
          <LoadingSpinner />
          <span className="text-xs text-foreground-secondary">加载中...</span>
        </div>
      ) : organizations.length === 0 ? (
        <div className="px-3 py-2 text-xs text-foreground-secondary">
          暂无组织
        </div>
      ) : (
        <>
          {displayedOrganizations.map((organization: Organization) => (
            <button
              key={organization.id}
              onClick={() => handleOrganizationClick(organization.id)}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                'min-h-[44px]', // 移动端触摸优化
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                'active:bg-surface-active',
                {
                  'bg-primary-light text-primary font-medium': currentOrganizationId === String(organization.id),
                  'text-foreground hover:bg-surface-hover': currentOrganizationId !== String(organization.id),
                }
              )}
              style={{
                outline: 'none',
                boxShadow: 'none'
              }}
              title={organization.name}
              aria-current={currentOrganizationId === String(organization.id) ? 'page' : undefined}
            >
              <BuildingIcon />
              <span className="truncate">{organization.name}</span>
            </button>
          ))}
          {hasMore && (
            <button
              onClick={handleShowMore}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                'min-h-[44px]', // 移动端触摸优化
                'text-foreground hover:bg-surface-hover',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                'active:bg-surface-active'
              )}
            >
              <PlusIcon />
              <span>{showAll ? '收起' : '显示更多'}</span>
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ==================== 图标组件 ====================

function BuildingIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg
      className="w-3 h-3 animate-spin text-foreground-tertiary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
