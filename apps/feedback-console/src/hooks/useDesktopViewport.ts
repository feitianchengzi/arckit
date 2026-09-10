import { useEffect, useState } from 'react'

const DESKTOP_VIEWPORT_QUERY = '(min-width: 1024px)'

function getDesktopViewportMatch() {
  return typeof window !== 'undefined' && window.matchMedia(DESKTOP_VIEWPORT_QUERY).matches
}

export function useDesktopViewport() {
  const [isDesktop, setIsDesktop] = useState(getDesktopViewportMatch)

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_VIEWPORT_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches)

    setIsDesktop(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isDesktop
}
