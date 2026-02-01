import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OrganizationState {
  currentOrganizationId: number | null
  setCurrentOrganizationId: (id: number | null) => void
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      currentOrganizationId: null,
      setCurrentOrganizationId: (id) => set({ currentOrganizationId: id }),
    }),
    {
      name: 'organization-storage',
    }
  )
)
