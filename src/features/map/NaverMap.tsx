'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useMapStore } from '@/store/mapStore'
import { getPlaceDetail } from '@/lib/api/places'

export default function NaverMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<naver.maps.Map | null>(null)
  const markersRef = useRef<naver.maps.Marker[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mapCenter = useMapStore((s) => s.mapCenter)
  const markers = useMapStore((s) => s.markers)
  const setMapCenter = useMapStore((s) => s.setMapCenter)
  const setMapBounds = useMapStore((s) => s.setMapBounds)
  const setSelectedPlace = useMapStore((s) => s.setSelectedPlace)
  const setNeedsSearch = useMapStore((s) => s.setNeedsSearch)

  const createMarkerIcon = useCallback((isRecommended: boolean) => {
    // 디자인 토큰과 동기화 (src/styles/tokens.colors.css):
    // #825500 = --color-primary-container (메인 브랜드, 추천 강조)
    // #d9ac2c = --color-badge-yellow (밝은 골드, 일반 마커)
    const color = isRecommended ? '#825500' : '#d9ac2c'
    return {
      content: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;"></div>`,
      anchor: new naver.maps.Point(14, 14),
    }
  }, [])

  const updateBounds = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map || !window.naver?.maps) return

    const bounds = map.getBounds()
    const sw = bounds.getMin()
    const ne = bounds.getMax()
    const center = map.getCenter()

    setMapCenter({ lat: center.lat(), lng: center.lng() })
    setMapBounds({
      minLatitude: sw.lat(),
      maxLatitude: ne.lat(),
      minLongitude: sw.lng(),
      maxLongitude: ne.lng(),
    })
  }, [setMapCenter, setMapBounds])

  // 지도 이동/줌 변경 시 debounce 후 bounds 업데이트
  const handleMapChanged = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateBounds()
      setNeedsSearch(true)
    }, 500)
  }, [updateBounds, setNeedsSearch])

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps) return

    const isXl = window.innerWidth >= 1280

    const map = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(mapCenter.lat, mapCenter.lng),
      zoom: 15,
      zoomControl: isXl,
      zoomControlOptions: {
        position: naver.maps.Position.TOP_RIGHT,
      },
      scaleControl: false,
    } as naver.maps.MapOptions & { scaleControl: boolean })

    mapInstanceRef.current = map

    // 줌/드래그 이벤트
    naver.maps.Event.addListener(map, 'zoom_changed', handleMapChanged)
    naver.maps.Event.addListener(map, 'dragend', handleMapChanged)

    // 현재 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          if (!window.naver?.maps) return
          const center = new naver.maps.LatLng(latitude, longitude)
          map.setCenter(center)
          // 위치 이동 후 bounds 업데이트 (약간의 딜레이 필요)
          setTimeout(updateBounds, 100)
        },
        () => {
          // fallback: 서울 시청 기준 bounds
          updateBounds()
        },
        { timeout: 5000 }
      )
    } else {
      updateBounds()
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []
      mapInstanceRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 외부에서 지도 중심 이동 요청 처리
  useEffect(() => {
    const el = mapRef.current
    if (!el) return

    const handler = (e: Event) => {
      const { lat, lng } = (e as CustomEvent).detail
      const map = mapInstanceRef.current
      if (map && window.naver?.maps) {
        map.setCenter(new naver.maps.LatLng(lat, lng))
        setTimeout(updateBounds, 100)
      }
    }

    el.addEventListener('moveToCenter', handler)
    return () => el.removeEventListener('moveToCenter', handler)
  }, [updateBounds])

  // 마커 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current || !window.naver?.maps) return

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    markers.forEach((place) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(place.latitude, place.longitude),
        map: mapInstanceRef.current!,
        icon: createMarkerIcon(place.isRecommended),
      })

      naver.maps.Event.addListener(marker, 'click', async () => {
        try {
          const detail = await getPlaceDetail(place.id)
          setSelectedPlace(detail)
        } catch {
          // 상세 조회 실패 시 무시
        }
      })

      markersRef.current.push(marker)
    })
  }, [markers, createMarkerIcon, setSelectedPlace])

  return <div ref={mapRef} data-naver-map className="h-full w-full" />
}
