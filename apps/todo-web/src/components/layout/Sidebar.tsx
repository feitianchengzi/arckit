'use client'

/**
 * Sidebar - 主导航侧边栏
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import type { UIEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useOrganizationStore } from '@/store/organizationStore'
import { useInfiniteOrganizationList } from '@/hooks/useOrganizations'
import { ProjectListContent } from './ProjectList'
import { CreateOrganizationDialog } from '../features/CreateOrganizationDialog'
import { CreateProjectDialog } from '../features/CreateProjectDialog'
import { Avatar } from '@/components/ui'
import { buildFeedbackOrganizationPath, buildOrganizationPath, decodeOrganizationId } from '@/lib/utils/organizationRouting'

interface SidebarProps {
  className?: string
  isOpen?: boolean
  onClose?: () => void
}

const ORGANIZATION_MENU_PAGE_SIZE = 20
const ORGANIZATION_MENU_SCROLL_THRESHOLD = 48

export function Sidebar({ className, isOpen = true, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const storeUser = useAuthStore((state) => state.user)
  const { theme, toggleTheme } = useThemeStore()
  const {
    data: organizationPages,
    isLoading: organizationsLoading,
    fetchNextPage: fetchNextOrganizationPage,
    hasNextPage: hasNextOrganizationPage,
    isFetchingNextPage: isFetchingNextOrganizationPage,
  } = useInfiniteOrganizationList(false, ORGANIZATION_MENU_PAGE_SIZE)
  const { currentOrganizationId, setCurrentOrganizationId } = useOrganizationStore()
  const projectScrollRef = useRef<HTMLDivElement>(null)
  const organizationMenuRef = useRef<HTMLDivElement>(null)
  const organizationListRef = useRef<HTMLDivElement>(null)

  const [user, setUser] = useState<typeof storeUser>(null)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [showCreateOrgDialog, setShowCreateOrgDialog] = useState(false)
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false)
  const [organizationMenuOpen, setOrganizationMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    setUser(storeUser)
  }, [storeUser])

  useEffect(() => {
    if (!organizationMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!organizationMenuRef.current?.contains(event.target as Node)) {
        setOrganizationMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [organizationMenuOpen])

  useEffect(() => {
    const organizationSlug = location.pathname.match(/\/(?:feedbacks\/)?organizations\/([^/]+)/)?.[1]
    if (!organizationSlug) return

    const decodedOrganizationId = decodeOrganizationId(organizationSlug)
    const routeOrganizationId = decodedOrganizationId ? Number(decodedOrganizationId) : NaN
    if (Number.isFinite(routeOrganizationId) && currentOrganizationId !== routeOrganizationId) {
      setCurrentOrganizationId(routeOrganizationId)
    }
  }, [currentOrganizationId, location.pathname, setCurrentOrganizationId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [searchQuery])

  const organizations = organizationPages?.pages.flatMap((page) => page.organizations) ?? []
  const selectedOrganization = currentOrganizationId
    ? organizations.find((organization) => organization.id === currentOrganizationId)
    : null
  const isFeedbackSection = location.pathname.startsWith('/feedbacks')
  const headerTitle = currentOrganizationId ? selectedOrganization?.name ?? '组织' : '个人项目'
  const displayUsername = mounted && user?.username ? user.username : '未登录'

  const handleNavClick = (href: string) => {
    navigate(href)
    if (window.innerWidth < 1024 && onClose) {
      onClose()
    }
  }

  const handleSelectOrganization = (organizationId: number | null) => {
    setCurrentOrganizationId(organizationId)
    setOrganizationMenuOpen(false)

    if (organizationId) {
      handleNavClick(
        isFeedbackSection
          ? buildFeedbackOrganizationPath(organizationId)
          : buildOrganizationPath(organizationId)
      )
      return
    }

    handleNavClick(isFeedbackSection ? '/feedbacks' : '/projects')
  }

  const handleOpenOrganizationSettings = () => {
    if (currentOrganizationId) {
      handleNavClick(
        isFeedbackSection
          ? buildFeedbackOrganizationPath(currentOrganizationId)
          : buildOrganizationPath(currentOrganizationId)
      )
      return
    }

    handleNavClick('/settings')
  }

  const handleCreateOrgSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['organizations'] })
  }

  const handleCreateProjectSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] })
  }

  const handleOrganizationMenuScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight

    if (
      distanceToBottom > ORGANIZATION_MENU_SCROLL_THRESHOLD ||
      !hasNextOrganizationPage ||
      isFetchingNextOrganizationPage
    ) {
      return
    }

    fetchNextOrganizationPage()
  }

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 z-50 flex h-screen max-h-screen w-[280px] max-w-[85vw] flex-col',
        'border-r border-border bg-surface-elevated text-foreground transition-colors',
        'transform transition-transform duration-300 ease-in-out lg:translate-x-0',
        {
          '-translate-x-full lg:translate-x-0': !isOpen,
          'translate-x-0': isOpen,
        },
        className
      )}
      aria-label="主导航"
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold text-foreground" title={headerTitle}>
            {headerTitle}
          </div>
        </div>

        <div ref={organizationMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setOrganizationMenuOpen((open) => !open)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
            title="切换组织"
            aria-label="切换组织"
            aria-expanded={organizationMenuOpen}
            aria-haspopup="menu"
          >
            <SwitchIcon />
          </button>

          {organizationMenuOpen && (
            <div
              className="absolute right-0 top-9 z-30 flex w-52 flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
              role="menu"
              style={{ maxHeight: 'min(320px, calc(100vh - 5rem))' }}
            >
              <button
                type="button"
                onClick={() => {
                  setOrganizationMenuOpen(false)
                  setShowCreateOrgDialog(true)
                }}
                className="w-full px-3 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:bg-primary-light focus:outline-none focus-visible:bg-primary-light"
                role="menuitem"
              >
                新建组织
              </button>
              <div className="my-1 border-t border-divider" />
              <button
                type="button"
                onClick={() => handleSelectOrganization(null)}
                className={clsx(
                  'w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-hover focus:outline-none focus-visible:bg-surface-hover',
                  !currentOrganizationId ? 'text-foreground font-medium' : 'text-foreground-secondary'
                )}
                role="menuitem"
              >
                个人项目
              </button>

              <div
                ref={organizationListRef}
                className="min-h-0 overflow-y-auto"
                onScroll={handleOrganizationMenuScroll}
                role="none"
              >
                {organizationsLoading ? (
                  <div className="px-3 py-2.5 text-sm text-foreground-secondary">加载中...</div>
                ) : (
                  organizations.map((organization) => (
                    <button
                      key={organization.id}
                      type="button"
                      onClick={() => handleSelectOrganization(organization.id)}
                      className={clsx(
                        'w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-hover focus:outline-none focus-visible:bg-surface-hover',
                        currentOrganizationId === organization.id
                          ? 'text-foreground font-medium'
                          : 'text-foreground-secondary'
                      )}
                      role="menuitem"
                      title={organization.name}
                    >
                      <span className="block truncate">{organization.name}</span>
                    </button>
                  ))
                )}

                {isFetchingNextOrganizationPage && (
                  <div className="px-3 py-2.5 text-sm text-foreground-secondary">加载中...</div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleOpenOrganizationSettings}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          title={currentOrganizationId ? '组织设置' : '用户设置'}
          aria-label={currentOrganizationId ? '组织设置' : '用户设置'}
        >
          <SettingsIcon />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 lg:hidden"
          title="关闭菜单"
          aria-label="关闭菜单"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="shrink-0 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary">
              <SearchIcon />
            </span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索项目"
              className="h-9 w-full rounded-md border border-border bg-surface py-0 pl-9 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-tertiary focus:border-primary/60 focus:shadow-[0_0_0_1px_rgba(59,130,246,0.18)]"
              type="search"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-foreground-tertiary transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                title="清除搜索"
                aria-label="清除搜索"
              >
                <ClearIcon />
              </button>
            )}
          </label>
          <button
            type="button"
            onClick={() => setShowCreateProjectDialog(true)}
            className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            title="新建项目"
            aria-label="新建项目"
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      <div ref={projectScrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <ProjectListContent
          onItemClick={handleNavClick}
          organizationId={currentOrganizationId}
          searchQuery={debouncedSearchQuery}
          scrollRootRef={projectScrollRef}
        />
      </div>

      <div className="shrink-0 border-t border-border px-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => handleNavClick('/settings')}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left focus:outline-none"
            title="用户设置"
            aria-label="用户设置"
          >
            <Avatar user={user} size="md" showTooltip={false} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={displayUsername}>
              {displayUsername}
            </span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            aria-pressed={theme === 'dark'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>

      <CreateOrganizationDialog
        open={showCreateOrgDialog}
        onClose={() => setShowCreateOrgDialog(false)}
        onSuccess={handleCreateOrgSuccess}
      />

      <CreateProjectDialog
        open={showCreateProjectDialog}
        onClose={() => setShowCreateProjectDialog(false)}
        onSuccess={handleCreateProjectSuccess}
        selectedOrganizationId={currentOrganizationId}
      />
    </aside>
  )
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
    </svg>
  )
}

function SwitchIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h12m0 0-4-4m4 4-4 4M17 17H5m0 0 4 4m-4-4 4-4" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 4.3c.4-1.7 2.9-1.7 3.4 0a1.8 1.8 0 0 0 2.7 1.1c1.5-.9 3.3.9 2.4 2.4a1.8 1.8 0 0 0 1.1 2.7c1.7.4 1.7 2.9 0 3.4a1.8 1.8 0 0 0-1.1 2.7c.9 1.5-.9 3.3-2.4 2.4a1.8 1.8 0 0 0-2.7 1.1c-.4 1.7-2.9 1.7-3.4 0a1.8 1.8 0 0 0-2.7-1.1c-1.5.9-3.3-.9-2.4-2.4a1.8 1.8 0 0 0-1.1-2.7c-1.7-.4-1.7-2.9 0-3.4a1.8 1.8 0 0 0 1.1-2.7c-.9-1.5.9-3.3 2.4-2.4a1.8 1.8 0 0 0 2.7-1.1Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.4 15.3A8.5 8.5 0 0 1 8.7 3.6 8.5 8.5 0 1 0 20.4 15.3Z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4V3m0 18v-1m8-8h1M3 12h1m14.1 6.1.7.7M5.2 5.2l.7.7m12.2-.7-.7.7M5.2 18.8l.7-.7M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}
