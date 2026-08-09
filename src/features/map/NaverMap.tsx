'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useMapStore } from '@/store/mapStore'
import { getPlaceDetail } from '@/lib/api/places'

/**
 * 지도 마커의 색·크기. **앱과 같은 값이다**(mobile/constants/colors.ts 의 mapMarker).
 *
 * ⚠️ 값을 CSS 토큰(--color-map-marker)에서 못 읽어 온다 — 네이버 지도 SDK 에
 *    넘기는 것이 CSS 가 아니라 **HTML 문자열**이라 var() 가 안 풀린다.
 *    그래서 여기 적고, 토큰 쪽에도 같은 값을 두었다. 한쪽을 고치면 다른 쪽도 고친다.
 */
const MARKER_COLOR = '#6B5C4B'
/**
 * 그림판 크기와 핀 끝의 자리.
 *
 * ⚠️ viewBox 를 -2 부터 시작해 **사방에 2 를 비워 둔다.** 흰 테두리(stroke-width 2.5)가
 *    바깥으로 1.25 나가는데, 여백이 없으면 위쪽이 잘린다 — 실제로 잘려서 고쳤다(#786).
 *    핀 그림 자체는 32×40 그대로이고 여백만 붙는다.
 */
const MARKER_SIZE = { width: 36, height: 44 }
/** 핀 **끝**의 자리. 여백 2 만큼 밀린 값이다(SVG 좌표 16,38.5 + 2). */
const MARKER_TIP = { x: 18, y: 40.5 }

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

  const createMarkerIcon = useCallback(() => {
    // 앱과 **같은 그림**이다(mobile/assets/images/map-marker*.png — 이 SVG 로 구웠다).
    // 모양·크기·색을 한쪽만 고치면 두 화면이 갈리므로 함께 본다.
    //
    // 물방울 핀인 이유: 끝이 좌표를 콕 집는다. 전에는 동그라미라 중심이 좌표인지
    // 아래가 좌표인지 모호했다.
    //
    // ⚠️ anchor 는 **핀 끝**이다(MARKER_TIP). 동그라미 때는 한가운데였다.
    //    가운데로 두면 핀이 실제 위치보다 20px 위에 그려진다.
    return {
      content: `<svg width="${MARKER_SIZE.width}" height="${MARKER_SIZE.height}" viewBox="-2 -2 36 44" style="cursor:pointer;display:block"><path d="M16 38.5C16 38.5 2.5 24 2.5 14.5a13.5 13.5 0 1 1 27 0C29.5 24 16 38.5 16 38.5z" fill="${MARKER_COLOR}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><circle cx="16" cy="14.5" r="5" fill="#fff"/></svg>`,
      anchor: new naver.maps.Point(MARKER_TIP.x, MARKER_TIP.y),
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

    // ⚠️ 마커는 **추천 여부로 안 가른다.** 서버가 그 값을 안 채우고 있다 —
    //    2026-08-09 에 네 카테고리 146곳을 다 받아 봤는데 isRecommended 가 전부 false 였다.
    //    없는 데이터로 분기를 만들면 아무도 못 보는 코드가 남는다(#786).
    //    목록·상세의 「추천」 뱃지는 그대로 두었다 — 그건 기능을 접는다는 결정이 따로 필요하다.
    markers.forEach((place) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(place.latitude, place.longitude),
        map: mapInstanceRef.current!,
        icon: createMarkerIcon(),
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
