// 네이버 지도 SDK 타입 선언.
//
// SDK를 <Script>로 불러와 window.naver 로 쓰기 때문에, 공식 타입 패키지 없이
// 우리가 실제로 쓰는 클래스·옵션만 직접 적는다.
//
// 왜 컴포넌트가 아니라 여기 있나:
// 원래 NaverMap.tsx 안에 있었는데, 화면 컴포넌트가 외부 SDK의 타입 선언까지
// 들고 있을 이유가 없다. 선언 파일로 옮기면 지도를 쓰는 다른 파일도 같은 타입을
// 그대로 쓸 수 있고, 컴포넌트는 화면 코드만 남는다.
//
// 이 파일은 import/export가 없어 전역 스크립트로 취급되므로 declare global 래퍼가 필요 없다.

interface Window {
  naver: typeof naver
}

declare namespace naver.maps {
  class Map {
    constructor(el: HTMLElement, options: MapOptions)
    setCenter(center: LatLng): void
    getCenter(): LatLng
    getZoom(): number
    setZoom(zoom: number): void
    getBounds(): LatLngBounds
  }
  class LatLng {
    constructor(lat: number, lng: number)
    lat(): number
    lng(): number
  }
  class LatLngBounds {
    getMin(): LatLng
    getMax(): LatLng
  }
  class Marker {
    constructor(options: MarkerOptions)
    setMap(map: Map | null): void
    getPosition(): LatLng
  }
  class Event {
    static addListener(
      target: unknown,
      eventName: string,
      handler: (...args: unknown[]) => void
    ): void
  }
  interface MapOptions {
    center: LatLng
    zoom: number
    zoomControl?: boolean
    zoomControlOptions?: {
      position: number
    }
  }
  interface MarkerOptions {
    position: LatLng
    map: Map
    icon?: {
      content: string
      anchor: Point
    }
  }
  class Point {
    constructor(x: number, y: number)
  }
  const Position: {
    TOP_RIGHT: number
  }
}
