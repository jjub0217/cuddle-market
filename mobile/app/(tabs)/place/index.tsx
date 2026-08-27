import type { CameraChangeReason, Region } from '@mj-studio/react-native-naver-map';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryTabs } from '@/components/places/category-tabs';
import { MapBoundary } from '@/components/places/map-fallback';
import PlaceMap, { isMapAvailable } from '@/components/places/place-map';
import { PlaceSheet, type PlaceSheetRef } from '@/components/places/place-sheet';
import { SearchInMapButton } from '@/components/places/search-in-map-button';
import { getPlaces } from '@/lib/places/api';
import { type MapBounds, type PlaceCategory, type PlaceListItem } from '@/lib/places/types';

// 「플레이스」 — 반려동물과 갈 만한 곳을 지도에서 찾는다. 웹의 /map 과 같은 화면이다.
//
// 이름을 「지도」라 하지 않는 이유는 웹 하단 바가 「플레이스」라 부르기 때문이다.
// 탭 이름과 화면 이름이 다르면 같은 곳인지 헷갈린다.
//
// 화면이 지도로 꽉 차고, 아래에서 목록이 올라온다. 카테고리 알약은 **목록 시트 안**에 있다
// — 지도 위에 두면 안 그래도 좁은 지도를 가린다(설계 §5-1, 네이버 지도 앱도 그렇다).
//
// ⚠️ 지도 부품을 여기서 직접 가져오지 않는다. place-map.tsx 가 try/catch 로 감싸 두었다 —
//    expo-router 는 앱을 켤 때 app/ 아래 화면 파일을 **전부 한 번씩 읽어서**, 여기서 바로
//    가져오면 부품 없는 빌드에서 앱 자체가 안 열린다(2026-08-06에 겪었다).
//    맨 위의 `import type` 은 타입만이라 빌드 결과에 남지 않는다.

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
  const sheetRef = useRef<PlaceSheetRef>(null);

  const [category, setCategory] = useState<PlaceCategory>('HOSPITAL');
  const [places, setPlaces] = useState<PlaceListItem[]>([]);
  // 지도가 있어야 첫 조회가 시작된다(카메라 이벤트로 영역을 알려주기 때문이다).
  // 지도가 없는 빌드에서 true 로 두면 **인디케이터가 영영 돈다** — 실제로 그랬다.
  const [loading, setLoading] = useState(isMapAvailable);
  /** 지도를 옮겨서 「지금 보이는 곳」과 목록이 어긋난 상태. 이때만 단추를 보인다. */
  const [needsSearch, setNeedsSearch] = useState(false);
  // ⚠️ 같은 값을 ref 로도 들고 있는다. onCameraChanged 는 **끄는 동안 매 프레임** 오는데,
  //    상태로만 판단하면 그 프레임들이 아직 옛 값을 보고 collapse 를 다시 부른다.
  //    그러면 내려가는 중에 계속 처음부터 다시 시작해 **영영 안 내려간다.**
  const needsSearchRef = useRef(false);

  // 지금 지도에 보이는 영역. 그릴 필요가 없어서 상태로 두지 않는다 —
  // 손가락을 움직일 때마다 화면을 다시 그리면 지도가 버벅인다.
  const boundsRef = useRef<MapBounds | null>(null);

  // 첫 화면을 채웠는지. onCameraIdle 이 처음에 안 올 수도 있어 대비한다(아래 설명).
  const loadedOnceRef = useRef(false);

  // 늦게 온 답이 새 답을 덮어쓰지 않게 하는 표. 빠르게 여러 번 찾으면 요청이 겹친다.
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
      // 목록은 비워 거짓 정보를 남기지 않는다. 다시 찾으면 된다.
      setPlaces([]);
    } finally {
      if (myId === reqIdRef.current) setLoading(false);
    }
  }, []);

  // 카테고리를 바꾸면 **바로** 다시 찾는다. 단추를 기다리지 않는다 —
  // 종류를 고른 것 자체가 「이걸로 보여줘」라는 분명한 요청이다.
  useEffect(() => {
    if (!boundsRef.current) return;
    needsSearchRef.current = false;
    setNeedsSearch(false);
    void load(boundsRef.current, category);
  }, [category, load]);

  const handleCameraChanged = useCallback(
    ({ region, reason }: { region: Region; reason: CameraChangeReason }) => {
      boundsRef.current = toBounds(region);

      // 맨 처음 한 번은 자동으로 채운다. onCameraIdle 은 「움직이다 멈췄을 때」 오는
      // 이벤트라, 아무도 지도를 안 건드리면 영영 안 와서 첫 화면이 빈 채로 남는다.
      if (!loadedOnceRef.current) {
        loadedOnceRef.current = true;
        void load(boundsRef.current, category);
        return;
      }

      // ⚠️ **손으로 옮겼을 때만** 반응한다. 'Developer'(우리가 옮긴 것)나 'Location'
      //    까지 세면 엉뚱할 때 단추가 뜬다.
      if (reason !== 'Gesture') return;
      if (needsSearchRef.current) return; // 이번 움직임에는 이미 반응했다

      // 자동으로 찾지 않는다 — 지도를 옮기는 게 늘 「여기 찾아줘」는 아니다.
      // 대신 단추를 띄우고, 목록은 비켜 준다(지도를 만졌으면 지도를 보고 싶다는 뜻이다).
      needsSearchRef.current = true;
      setNeedsSearch(true);
      sheetRef.current?.collapse();
    },
    [category, load]
  );

  const searchHere = useCallback(() => {
    if (!boundsRef.current) return;
    needsSearchRef.current = false;
    setNeedsSearch(false);
    void load(boundsRef.current, category);
  }, [category, load]);

  const openDetail = useCallback((id: number) => router.push(`/place/places/${id}`), [router]);

  return (
    <View style={styles.screen}>
      {/* 지도가 못 뜨더라도 목록은 그대로 쓸 수 있게, 지도만 그물로 감싼다. */}
      <MapBoundary>
        <PlaceMap
          places={places}
          onCameraChanged={handleCameraChanged}
          onPressPlace={openDetail}
        />
      </MapBoundary>

      {/* 웹은 이 단추를 아래 가운데 두지만 앱은 아래를 목록이 덮는다. 위로 올린다
          (네이버 지도 앱도 위다 — 설계 §5-1). 상태바를 비켜 놓는다. */}
      {needsSearch ? (
        <View style={[styles.searchButton, { top: insets.top + 12 }]} pointerEvents="box-none">
          <SearchInMapButton onPress={searchHere} />
        </View>
      ) : null}

      <PlaceSheet
        ref={sheetRef}
        places={places}
        loading={loading}
        onPressPlace={openDetail}
        header={<CategoryTabs selected={category} onSelect={setCategory} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchButton: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
