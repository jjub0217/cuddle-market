import type {
  NaverMapMarkerOverlayProps,
  NaverMapViewProps,
  Region,
} from '@mj-studio/react-native-naver-map';
import type { ComponentType } from 'react';
import { StyleSheet } from 'react-native';

import { MapUnavailable } from '@/components/places/map-fallback';
import { DEFAULT_CENTER, type PlaceListItem } from '@/lib/places/types';

// 지도만 담당하는 조각. **네이티브 부품을 쓰는 코드를 여기 한 곳에 가둔다.**
//
// ⚠️ `import { NaverMapView } from '...'` 로 가져오면 안 된다.
//
//    그 모듈은 읽히는 순간 TurboModuleRegistry.getEnforcing 을 부르고, 부품이 없는
//    빌드에서는 **거기서 바로 터진다.** 그 자리는 React 가 그리는 도중이 아니라서
//    오류 그물(ErrorBoundary)도, Suspense 도 못 받아낸다. 실제로 둘 다 못 잡았다
//    (2026-08-06). 화면에는 「'RNCNaverMapUtil' could not be found」만 뜬다.
//
//    그래서 require 로 가져와 try/catch 로 감싼다. require 는 그 자리에서 바로 읽으므로
//    터지는 것도 그 자리에서 잡힌다.
//
// 맨 위의 `import type` 은 타입만 가져오는 것이라 빌드 결과에 남지 않는다 — 안전하다.

/** 시 하나가 들어올 만한 배율. 너무 넓으면 핀이 수백 개, 너무 좁으면 빈 화면이 된다. */
const INITIAL_ZOOM = 13;

interface NaverMapModule {
  NaverMapView: ComponentType<NaverMapViewProps>;
  NaverMapMarkerOverlay: ComponentType<NaverMapMarkerOverlayProps>;
}

/** 부품이 있으면 그 조각들, 없으면 null. 앱을 켤 때 딱 한 번 판단한다. */
const naver: NaverMapModule | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@mj-studio/react-native-naver-map') as NaverMapModule;
  } catch {
    // 옛 빌드를 쓰는 폰이다. 앱을 죽이지 않고 안내만 보여준다.
    return null;
  }
})();

interface Props {
  places: PlaceListItem[];
  onCameraChanged: (params: { region: Region }) => void;
  onCameraIdle: (params: { region: Region }) => void;
  onPressPlace: (id: number) => void;
}

export default function PlaceMap({
  places,
  onCameraChanged,
  onCameraIdle,
  onPressPlace,
}: Props) {
  if (!naver) return <MapUnavailable />;

  const { NaverMapView, NaverMapMarkerOverlay } = naver;

  return (
    <NaverMapView
      style={StyleSheet.absoluteFill}
      initialCamera={{ ...DEFAULT_CENTER, zoom: INITIAL_ZOOM }}
      onCameraChanged={onCameraChanged}
      onCameraIdle={onCameraIdle}
      isShowZoomControls={false}
      isShowScaleBar={false}
    >
      {places.map((place) => (
        <NaverMapMarkerOverlay
          key={place.id}
          latitude={place.latitude}
          longitude={place.longitude}
          onTap={() => onPressPlace(place.id)}
          // 크기를 안 주면 개발 빌드와 출시 빌드에서 다르게 나온다(SDK 문서 경고).
          width={24}
          height={32}
        />
      ))}
    </NaverMapView>
  );
}
