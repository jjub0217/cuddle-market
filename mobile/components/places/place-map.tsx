import type {
  NaverMapMarkerOverlayProps,
  NaverMapViewProps,
  Region,
} from '@mj-studio/react-native-naver-map';
import { useEffect, useState, type ComponentType } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

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

// 초기화된 뒤에도 그림이 다 그려지기까지 더 걸린다. 그동안 도는 표시를 남겨 둘 시간.
//
// ⚠️ 이건 **재 본 값이지 정확한 신호가 아니다.** 이 지도 SDK 에는 「다 그렸다」를
//    알려주는 이벤트가 없다(초기화·카메라·탭이 전부다). 실기기에서 초기화 1초,
//    그림까지 3초 더 걸렸다(2026-08-06).
//
//    그래서 이 시간이 지나도 안 그려졌거나 먼저 그려졌을 수 있다. 어긋나도 괜찮게
//    **배경 없이 도는 표시만** 남긴다 — 지도가 먼저 그려지면 그 위로 비쳐 보이고,
//    누르는 것도 막지 않는다.
const GRACE_MS = 3000;

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

/**
 * 지도를 그릴 수 있는 빌드인가. 화면이 이걸 보고 「불러오는 중」을 띄울지 정한다 —
 * 지도가 없으면 카메라 이벤트가 영영 안 와서 그냥 두면 인디케이터가 계속 돈다.
 */
export const isMapAvailable = naver !== null;

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
  // 지도가 준비되기 전까지 그 위에 덮어 둘 안내.
  //
  // ⚠️ 왜 필요한가 — 준비되는 동안 회색 판만 보이는데, **못 불러왔을 때도 회색 판**이다.
  //    사용자는 고장인지 기다리는 중인지 구분할 수 없다. 실기기에서 「회색 판이 보이다가
  //    지도가 나온다」고 느껴졌다(2026-08-06). 말로 구분해 준다.
  const [초기화됨, set초기화됨] = useState(false);
  const [유예끝, set유예끝] = useState(false);

  useEffect(() => {
    if (!초기화됨) return;
    const id = setTimeout(() => set유예끝(true), GRACE_MS);
    return () => clearTimeout(id);
  }, [초기화됨]);

  if (!naver) return <MapUnavailable />;

  const { NaverMapView, NaverMapMarkerOverlay } = naver;

  return (
    <>
    <NaverMapView
      style={StyleSheet.absoluteFill}
      initialCamera={{ ...DEFAULT_CENTER, zoom: INITIAL_ZOOM }}
      onCameraChanged={onCameraChanged}
      onCameraIdle={onCameraIdle}
      onInitialized={() => set초기화됨(true)}
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

      {유예끝 ? null : (
        // 누르는 것을 막지 않는다 — 지도가 먼저 그려졌으면 바로 만질 수 있어야 한다.
        <View
          style={[styles.loading, 초기화됨 && styles.loadingClear]}
          pointerEvents="none"
        >
          <ActivityIndicator />
          {/* 글자는 회색 판일 때만. 지도가 비쳐 보이기 시작하면 글자가 지저분하다. */}
          {초기화됨 ? null : <Text style={styles.loadingText}>지도를 불러오는 중</Text>}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    // 못 불러왔을 때(map-fallback.tsx)와 같은 회색이다. 글자로만 구분한다 —
    // 색까지 다르면 잠깐 사이에 두 번 바뀌어 어수선하다.
    backgroundColor: '#F3F4F6',
  },
  // 초기화된 뒤. 배경을 걷어 지도가 그려지는 대로 비쳐 보이게 한다.
  loadingClear: { backgroundColor: 'transparent' },
  loadingText: { fontSize: 13, color: '#6B7280' },
});
