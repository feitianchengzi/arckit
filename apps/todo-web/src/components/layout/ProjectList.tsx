'use client'

/**
 * ProjectList - Sidebar 项目列表组件
 */

import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { PROJECT_LIST_PAGE_SIZE, useInfiniteProjectList } from '@/hooks/useProjects'
import { useAuthStore } from '@/store/authStore'
import { buildFeedbackProjectPath, buildProjectPath, decodeProjectId, parseProjectSlugFromPath } from '@/lib/utils/projectRouting'
import type { Project } from '@/types'

interface ProjectListProps {
  onItemClick?: (href: string) => void
  organizationId?: number | null
  searchQuery?: string
  scrollRootRef?: RefObject<HTMLDivElement>
}

const LOAD_MORE_DISTANCE = 96
const LOAD_MORE_COOLDOWN_MS = 700

export function ProjectList(props: ProjectListProps = {}) {
  const localScrollRootRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={localScrollRootRef} className="h-full overflow-y-auto">
      <ProjectListContent
        {...props}
        scrollRootRef={props.scrollRootRef ?? localScrollRootRef}
      />
    </div>
  )
}

export function ProjectListContent({
  onItemClick,
  organizationId,
  searchQuery = '',
  scrollRootRef,
}: ProjectListProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const isFeedbackSection = pathname.startsWith('/feedbacks')
  const user = useAuthStore((state) => state.user)
  const lastScrollTopRef = useRef(0)
  const lastLoadMoreAtRef = useRef(0)

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteProjectList(organizationId, PROJECT_LIST_PAGE_SIZE, searchQuery)

  const projects = useMemo(() => {
    const seen = new Set<number>()
    const loadedProjects = data?.pages.flatMap((page) => page.projects) ?? []

    return loadedProjects.filter((project) => {
      if (seen.has(project.id)) return false
      seen.add(project.id)
      return true
    })
  }, [data])

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aIsMine = Boolean(user?.id && a.creator_id === user.id)
      const bIsMine = Boolean(user?.id && b.creator_id === user.id)

      if (aIsMine && !bIsMine) return -1
      if (!aIsMine && bIsMine) return 1
      return 0
    })
  }, [projects, user?.id])

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const visibleProjects = useMemo(() => {
    if (!normalizedSearch) return sortedProjects
    return sortedProjects.filter((project) => project.name.toLowerCase().includes(normalizedSearch))
  }, [normalizedSearch, sortedProjects])

  const currentProjectSlug = parseProjectSlugFromPath(pathname)
  const currentProjectId = currentProjectSlug ? decodeProjectId(currentProjectSlug) : null

  useEffect(() => {
    const root = scrollRootRef?.current
    if (!root) return

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = root
      const scrollingDown = scrollTop > lastScrollTopRef.current
      lastScrollTopRef.current = Math.max(scrollTop, 0)

      if (!scrollingDown) return
      if (!hasNextPage || isLoading || isFetchingNextPage) return
      if (scrollHeight - scrollTop - clientHeight > LOAD_MORE_DISTANCE) return

      const now = Date.now()
      if (now - lastLoadMoreAtRef.current < LOAD_MORE_COOLDOWN_MS) return

      lastLoadMoreAtRef.current = now
      fetchNextPage()
    }

    root.addEventListener('scroll', handleScroll, { passive: true })
    return () => root.removeEventListener('scroll', handleScroll)
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, scrollRootRef])

  const handleProjectClick = (projectId: number) => {
    const href = isFeedbackSection ? buildFeedbackProjectPath(projectId) : buildProjectPath(projectId)
    if (onItemClick) {
      onItemClick(href)
    } else {
      navigate(href)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-foreground-secondary">
        <LoadingSpinner />
        <span>加载中...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-3 py-2 text-xs text-foreground-secondary">
        项目加载失败
      </div>
    )
  }

  if (visibleProjects.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-foreground-secondary">
        {normalizedSearch ? '没有匹配项目' : '暂无项目'}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {visibleProjects.map((project: Project) => {
        const isActive = currentProjectId === String(project.id)

        return (
          <button
            key={project.id}
            onClick={() => handleProjectClick(project.id)}
            className={clsx(
              'linear-project-item w-full h-9 min-w-0 flex items-center rounded-md px-3 text-left text-sm transition-colors',
              'focus:outline-none focus-visible:bg-surface-hover',
              isActive
                ? 'is-active text-foreground font-medium'
                : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
            )}
            title={project.name}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="truncate">{project.name}</span>
          </button>
        )
      })}

      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-2">
          <LoadingSpinner />
        </div>
      )}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <svg
      className="w-3 h-3 animate-spin text-foreground-tertiary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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
