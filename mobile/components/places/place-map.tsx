import { NaverMapMarkerOverlay, NaverMapView, type Region } from '@mj-studio/react-native-naver-map';
import { StyleSheet } from 'react-native';

import { DEFAULT_CENTER, type PlaceListItem } from '@/lib/places/types';

// 지도만 담당하는 조각. **네이티브 부품을 쓰는 코드를 여기 한 곳에 가둔다.**
//
// ⚠️ 왜 화면에서 떼어냈나 —
//    expo-router 는 앱을 켤 때 app/ 아래 화면 파일을 **전부 한 번씩 읽는다.** 그래서
//    화면 첫 줄에 지도를 import 해 두면, 부품이 없는 빌드에서 **앱 자체가 안 열린다.**
//    실제로 겪었다: 「'RNCNaverMapUtil' could not be found」로 홈·커뮤니티까지 다 죽었다.
//
//    이 파일을 화면에서 늦게(React.lazy) 불러오면, 부품이 없어도 앱은 열리고
//    플레이스 탭만 안내 문구를 보여준다.

/** 시 하나가 들어올 만한 배율. 너무 넓으면 핀이 수백 개, 너무 좁으면 빈 화면이 된다. */
const INITIAL_ZOOM = 13;

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
