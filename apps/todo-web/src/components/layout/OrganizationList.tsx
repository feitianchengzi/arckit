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
  selectedOrganizationId?: number | null
  onSelectOrganization?: (organizationId: number | null) => void
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

export function OrganizationList({ onItemClick, selectedOrganizationId, onSelectOrganization }: OrganizationListProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const { data: organizations = [], isLoading } = useOrganizationList()
  const [showAll, setShowAll] = useState(false)
  const isPersonalActive = !selectedOrganizationId && pathname?.startsWith('/projects')

  // 获取当前选中的组织 ID
  const routeOrganizationId = pathname?.match(/\/organizations\/(\d+)/)?.[1]
  const currentOrganizationId = selectedOrganizationId !== undefined && selectedOrganizationId !== null
    ? String(selectedOrganizationId)
    : routeOrganizationId

  // 控制显示的组织数量，最多显示3个，除非用户点击"显示更多"
  const displayedOrganizations = showAll ? organizations : organizations.slice(0, 3)
  const hasMore = organizations.length > 3

  const handleOrganizationClick = (organizationId: number) => {
    if (onSelectOrganization) {
      onSelectOrganization(organizationId)
    }
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
  
  const handlePersonalClick = () => {
    if (onSelectOrganization) {
      onSelectOrganization(null)
    }
    const href = '/projects'
    if (onItemClick) {
      onItemClick(href)
    } else {
      navigate(href)
    }
  }

  return (
    <div className="space-y-1 px-2">
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
          {displayedOrganizations.map((organization: Organization) => {
            const initial = organization.name?.trim()?.charAt(0)?.toUpperCase() || '?'
            const isActive = currentOrganizationId === String(organization.id)
            return (
              <button
                key={organization.id}
                onClick={() => handleOrganizationClick(organization.id)}
                className={clsx(
                  'w-full flex flex-col items-center gap-1 px-2 py-2 text-xs rounded-md transition-colors relative',
                  'min-h-[64px]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  'text-foreground-secondary hover:text-foreground font-semibold',
                  {
                    'text-primary': isActive,
                  }
                )}
                style={{
                  outline: 'none',
                  boxShadow: 'none'
                }}
                title={organization.name}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="relative">
                  <span
                    className={clsx(
                      'absolute left-[-16px] top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-full transition-all bg-primary',
                      isActive ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span
                    className={clsx(
                      'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold border transition-colors',
                      isActive
                        ? 'bg-primary-light text-primary border-primary org-tab-selected'
                        : 'bg-gray-200 dark:bg-[#2A2A2A] text-foreground-secondary hover:bg-surface-hover hover:text-foreground border-transparent'
                    )}
                  >
                    {initial}
                  </span>
                </span>
                <span className="truncate w-full text-center">{organization.name}</span>
              </button>
            )
          })}
          <button
            onClick={handlePersonalClick}
            className={clsx(
              'w-full flex flex-col items-center gap-1 px-2 py-2 text-xs rounded-md transition-colors relative',
              'min-h-[64px]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              'text-foreground-secondary hover:text-foreground font-semibold',
              {
                'text-primary': isPersonalActive,
              }
            )}
            style={{
              outline: 'none',
              boxShadow: 'none'
            }}
            title="个人项目"
            aria-current={isPersonalActive ? 'page' : undefined}
          >
            <span className="relative">
              <span
                className={clsx(
                  'absolute left-[-16px] top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-full transition-all bg-primary',
                  isPersonalActive ? 'opacity-100' : 'opacity-0'
                )}
              />
              <span
                className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold border transition-colors',
                    isPersonalActive
                      ? 'bg-primary-light text-primary border-primary org-tab-selected'
                      : 'bg-gray-200 dark:bg-[#2A2A2A] text-foreground-secondary hover:bg-surface-hover hover:text-foreground border-transparent'
                  )}
              >
                个
              </span>
            </span>
            <span className="truncate w-full text-center">个人项目</span>
          </button>
          {hasMore && (
            <button
              onClick={handleShowMore}
              className={clsx(
                'w-full flex flex-col items-center gap-1 px-2 py-2 text-xs rounded-md transition-colors',
                'min-h-[64px]',
                'text-foreground-secondary hover:text-foreground font-semibold',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                'active:bg-surface-hover'
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-[#2A2A2A] hover:bg-surface-hover text-base font-semibold text-foreground-secondary border border-transparent">
                +
              </span>
              <span>{showAll ? '收起' : '更多'}</span>
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ==================== 图标组件 ====================

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
