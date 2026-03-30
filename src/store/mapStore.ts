'use client'

import { create } from 'zustand'
import type {
  PlaceCategory,
  HospitalFilter,
  PlaceDetail,
  PlaceListItem,
  AnimalType,
  MapBounds,
} from '@/types/map'
import { DEFAULT_CENTER } from '@/constants/map'

interface MapStore {
  selectedCategory: PlaceCategory
  activeFilters: HospitalFilter[]
  selectedPlace: PlaceDetail | null
  mapCenter: { lat: number; lng: number }
  mapBounds: MapBounds | null
  markers: PlaceListItem[]
  isLoading: boolean

  setSelectedCategory: (category: PlaceCategory) => void
  toggleFilter: (filter: HospitalFilter) => void
  setSelectedPlace: (place: PlaceDetail | null) => void
  setMapCenter: (center: { lat: number; lng: number }) => void
  setMapBounds: (bounds: MapBounds) => void
  setMarkers: (markers: PlaceListItem[]) => void
  setIsLoading: (loading: boolean) => void
}

export const useMapStore = create<MapStore>((set) => ({
  selectedCategory: 'HOSPITAL',
  activeFilters: [],
  selectedPlace: null,
  mapCenter: DEFAULT_CENTER,
  mapBounds: null,
  markers: [],
  isLoading: false,

  setSelectedCategory: (category) =>
    set({ selectedCategory: category, activeFilters: [], selectedPlace: null }),

  toggleFilter: (filter) =>
    set((state) => ({
      activeFilters: state.activeFilters.includes(filter)
        ? state.activeFilters.filter((f) => f !== filter)
        : [...state.activeFilters, filter],
    })),

  setSelectedPlace: (place) => set({ selectedPlace: place }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapBounds: (mapBounds) => set({ mapBounds }),
  setMarkers: (markers) => set({ markers }),
  setIsLoading: (isLoading) => set({ isLoading }),
}))

export function getFilterParams(activeFilters: HospitalFilter[]) {
  const params: {
    is24Hours?: boolean
    isEmergencyAvailable?: boolean
    animalTypes?: AnimalType[]
  } = {}

  if (activeFilters.includes('is24Hours')) params.is24Hours = true
  if (activeFilters.includes('isEmergencyAvailable'))
    params.isEmergencyAvailable = true

  const animalTypes = activeFilters.filter(
    (f): f is AnimalType => f === 'REPTILE' || f === 'BIRD'
  )
  if (animalTypes.length > 0) params.animalTypes = animalTypes

  return params
}
