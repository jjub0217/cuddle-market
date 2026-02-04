import { create } from 'zustand'
import type { PetTypeTabId, PriceRange, LocationFilter, CategoryFilter, ProductTypeTabId } from '@/constants/constants'

interface FilterState {
  activePetTypeTab: PetTypeTabId
  selectedDetailPet: CategoryFilter | null
  selectedCategory: CategoryFilter | null
  selectedProductStatus: string | null
  selectedProductPrice: PriceRange | null
  selectedLocation: LocationFilter | null
  selectedSort: string
  activeProductTypeTab: ProductTypeTabId

  setActivePetTypeTab: (tab: PetTypeTabId) => void
  setSelectedDetailPet: (pet: CategoryFilter | null) => void
  setSelectedCategory: (category: CategoryFilter | null) => void
  setSelectedProductStatus: (status: string | null) => void
  setSelectedProductPrice: (price: PriceRange | null) => void
  setSelectedLocation: (location: LocationFilter | null) => void
  setSelectedSort: (sort: string) => void
  setActiveProductTypeTab: (tab: ProductTypeTabId) => void
  resetFilters: () => void
}

const initialState = {
  activePetTypeTab: 'tab-all' as PetTypeTabId,
  selectedDetailPet: null,
  selectedCategory: null,
  selectedProductStatus: null,
  selectedProductPrice: null,
  selectedLocation: null,
  selectedSort: '최신순',
  activeProductTypeTab: 'tab-all' as ProductTypeTabId,
}

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  setActivePetTypeTab: (tab) => set({ activePetTypeTab: tab }),
  setSelectedDetailPet: (pet) => set({ selectedDetailPet: pet }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedProductStatus: (status) => set({ selectedProductStatus: status }),
  setSelectedProductPrice: (price) => set({ selectedProductPrice: price }),
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  setSelectedSort: (sort) => set({ selectedSort: sort }),
  setActiveProductTypeTab: (tab) => set({ activeProductTypeTab: tab }),
  resetFilters: () => set(initialState),
}))
