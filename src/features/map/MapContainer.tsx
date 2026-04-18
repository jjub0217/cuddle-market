'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Script from 'next/script'
import CategoryTabs from './CategoryTabs'
import MyLocationButton from './MyLocationButton'
import SearchInMapButton from './SearchInMapButton'
import NaverMap from './NaverMap'
import PlaceListSidebar from './PlaceListSidebar'
import PlaceDetailSidebar from './PlaceDetailSidebar'
import PlaceDetailSlideCard from './PlaceDetailSlideCard'
import { useMapStore, getFilterParams } from '@/store/mapStore'
import { getPlaces } from '@/lib/api/places'

export default function MapContainer() {
  const [mapReady, setMapReady] = useState(false)
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
  const abortRef = useRef<AbortController | null>(null)

  const selectedCategory = useMapStore((s) => s.selectedCategory)
  const activeFilters = useMapStore((s) => s.activeFilters)
  const mapBounds = useMapStore((s) => s.mapBounds)
  const isLoading = useMapStore((s) => s.isLoading)
  const setMarkers = useMapStore((s) => s.setMarkers)
  const setIsLoading = useMapStore((s) => s.setIsLoading)
  const setNeedsSearch = useMapStore((s) => s.setNeedsSearch)

  const fetchPlaces = useCallback(async () => {
    const { mapBounds, selectedCategory, activeFilters } =
      useMapStore.getState()
    if (!mapBounds) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setIsLoading(true)
    try {
      const filterParams =
        selectedCategory === 'HOSPITAL' ? getFilterParams(activeFilters) : {}

      const response = await getPlaces({
        category: selectedCategory,
        ...mapBounds,
        size: 200,
        ...filterParams,
      })
      setMarkers(response.items)
    } catch {
      // 요청 실패 시 기존 마커 유지
    } finally {
      setIsLoading(false)
    }
  }, [setMarkers, setIsLoading])

  const initialLoadRef = useRef(true)

  // 초기 로드 시 자동 검색
  useEffect(() => {
    if (!mapReady || !mapBounds) return
    if (!initialLoadRef.current) return
    initialLoadRef.current = false
    fetchPlaces()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchPlaces, mapReady, mapBounds])

  // 카테고리, 필터 변경 시 자동 재검색
  useEffect(() => {
    if (!mapReady || initialLoadRef.current) return
    fetchPlaces()
    setNeedsSearch(false)
  }, [selectedCategory, activeFilters, fetchPlaces, mapReady, setNeedsSearch])

  useEffect(() => {
    if (window.naver?.maps) {
      setMapReady(true)
    }
  }, [])

  return (
    <>
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
        strategy="afterInteractive"
        onLoad={() => setMapReady(true)}
      />

      <div className="flex h-[calc(100vh-var(--header-height,72px)-56px)] flex-col xl:h-[calc(100vh-var(--header-height,72px))]">
        <CategoryTabs />

        <div className="flex flex-1 overflow-hidden">
          <PlaceListSidebar />
          <PlaceDetailSidebar />
          <div className="relative flex-1">
            {isLoading && (
              <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full bg-white px-4 py-2 shadow-md">
                <span className="text-xs text-gray-500">불러오는 중...</span>
              </div>
            )}

            {mapReady ? (
              <NaverMap />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
                  <p className="text-sm text-gray-500">
                    지도를 불러오는 중...
                  </p>
                </div>
              </div>
            )}

            <SearchInMapButton onSearch={() => { fetchPlaces(); setNeedsSearch(false) }} />
            <MyLocationButton />
            <PlaceDetailSlideCard />
          </div>
        </div>
      </div>
    </>
  )
}
