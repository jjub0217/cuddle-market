import { NaverMapMarkerOverlay, NaverMapView, type Region } from '@mj-studio/react-native-naver-map';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryTabs } from '@/components/places/category-tabs';
import { PlaceSheet } from '@/components/places/place-sheet';
import { getPlaces } from '@/lib/places/api';
import {
  DEFAULT_CENTER,
  type MapBounds,
  type PlaceCategory,
  type PlaceListItem,
} from '@/lib/places/types';

// 「플레이스」 — 반려동물과 갈 만한 곳을 지도에서 찾는다. 웹의 /map 과 같은 화면이다.
//
// 이름을 「지도」라 하지 않는 이유는 웹 하단 바가 「플레이스」라 부르기 때문이다.
// 탭 이름과 화면 이름이 다르면 같은 곳인지 헷갈린다.
//
// 화면이 지도로 꽉 차고, 위에 카테고리 알약, 아래에서 목록이 올라온다.
// 웹은 지도 **옆에** 목록을 세우는데 폰은 가로가 좁아 그대로 못 옮긴다.

/** 시 하나가 들어올 만한 배율. 너무 넓으면 핀이 수백 개가 되고, 너무 좁으면 빈 화면이 된다. */
const INITIAL_ZOOM = 13;

/** 지도가 알려주는 영역을 서버가 받는 네 귀퉁이로 바꾼다. */
function toBounds(region: Region): MapBounds {
  // Region 의 latitude/longitude 는 **남서쪽 귀퉁이**이고, delta 를 더하면 북동쪽이 된다.
  return {
    minLatitude: region.latitude,
    maxLatitude: region.latitude + region.latitudeDelta,
    minLongitude: region.longitude,
    maxLongitude: region.longitude + region.longitudeDelta,
  };
}

export default function PlaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<PlaceCategory>('HOSPITAL');
  const [places, setPlaces] = useState<PlaceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 지금 지도에 보이는 영역. 그릴 필요가 없어서 상태로 두지 않는다 —
  // 손가락을 움직일 때마다 화면을 다시 그리면 지도가 버벅인다.
  const boundsRef = useRef<MapBounds | null>(null);

  // 첫 화면을 채웠는지. onCameraIdle 이 처음에 안 올 수도 있어 대비한다(아래 설명).
  const loadedOnceRef = useRef(false);

  // 늦게 온 답이 새 답을 덮어쓰지 않게 하는 표. 지도를 빠르게 옮기면 요청이 겹친다.
  const reqIdRef = useRef(0);

  const load = useCallback(async (bounds: MapBounds, cat: PlaceCategory) => {
    const myId = ++reqIdRef.current;
    setLoading(true);
    try {
      const items = await getPlaces({ ...bounds, category: cat });
      if (myId !== reqIdRef.current) return; // 이미 더 새로운 요청이 나갔다
      setPlaces(items);
    } catch {
      if (myId !== reqIdRef.current) return;
      // 지도를 옮길 때마다 나가는 요청이라 실패를 시끄럽게 알리지 않는다.
      // 다음에 움직이면 다시 부른다. 대신 목록은 비워 거짓 정보를 남기지 않는다.
      setPlaces([]);
    } finally {
      if (myId === reqIdRef.current) setLoading(false);
    }
  }, []);

  // 카테고리를 바꾸면 보던 자리 그대로 다시 찾는다.
  useEffect(() => {
    if (boundsRef.current) void load(boundsRef.current, category);
  }, [category, load]);

  const handleCameraChanged = useCallback(
    ({ region }: { region: Region }) => {
      boundsRef.current = toBounds(region);
      // ⚠️ 여기서는 서버를 부르지 않는다 — 손가락 한 번에 수십 번 나간다.
      //
      // 다만 **맨 처음 한 번만** 예외다. onCameraIdle 은 「움직이다 멈췄을 때」
      // 오는 이벤트라, 아무도 지도를 안 건드리면 영영 안 올 수 있다.
      // 그러면 첫 화면의 목록이 계속 비어 있게 된다.
      if (!loadedOnceRef.current) {
        loadedOnceRef.current = true;
        void load(boundsRef.current, category);
      }
    },
    [category, load]
  );

  const handleCameraIdle = useCallback(
    ({ region }: { region: Region }) => {
      boundsRef.current = toBounds(region);
      void load(boundsRef.current, category);
    },
    [category, load]
  );

  const openDetail = useCallback((id: number) => router.push(`/places/${id}`), [router]);

  return (
    <View style={styles.screen}>
      <NaverMapView
        style={StyleSheet.absoluteFill}
        initialCamera={{ ...DEFAULT_CENTER, zoom: INITIAL_ZOOM }}
        onCameraChanged={handleCameraChanged}
        onCameraIdle={handleCameraIdle}
        isShowZoomControls={false}
        isShowScaleBar={false}
      >
        {places.map((place) => (
          <NaverMapMarkerOverlay
            key={place.id}
            latitude={place.latitude}
            longitude={place.longitude}
            onTap={() => openDetail(place.id)}
            // 크기를 안 주면 개발 빌드와 출시 빌드에서 다르게 나온다(SDK 문서 경고).
            width={24}
            height={32}
          />
        ))}
      </NaverMapView>

      {/* 알약은 지도 위에 뜬다. 상태바를 비켜 놓는다. */}
      <View style={[styles.tabs, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <CategoryTabs selected={category} onSelect={setCategory} />
      </View>

      <PlaceSheet places={places} loading={loading} onPressPlace={openDetail} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  tabs: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 8,
  },
});
