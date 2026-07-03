import { createContext, useContext } from 'react'

export interface DashboardLayoutContextValue {
  isProjectSidebarCollapsed: boolean
  toggleProjectSidebar: () => void
}

const fallbackDashboardLayoutContext: DashboardLayoutContextValue = {
  isProjectSidebarCollapsed: false,
  toggleProjectSidebar: () => undefined,
}

export const DashboardLayoutContext = createContext<DashboardLayoutContextValue>(fallbackDashboardLayoutContext)

export function useDashboardLayout() {
  return useContext(DashboardLayoutContext)
}
