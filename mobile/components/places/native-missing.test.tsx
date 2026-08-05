import { render, screen } from '@testing-library/react-native';

import PlaceMap from '@/components/places/place-map';

// 지도 부품이 없는 폰(옛 빌드)을 흉내 낸다.
//
// 왜 이 시험이 필요한가 — 부품이 없으면 그 모듈은 **읽히는 순간** 터진다. 그 자리는
// React 가 그리는 도중이 아니라서 오류 그물도 Suspense 도 못 받아낸다. 실제로 둘 다
// 못 잡아 앱이 통째로 죽었다(2026-08-06). place-map.tsx 가 require 를 try/catch 로
// 감싸 두었는데, 그 장치가 살아 있는지 여기서 지킨다.
//
// ⚠️ jest.mock 은 babel 이 import 보다 위로 끌어올린다 — 아래에 적어도 먼저 돈다.
jest.mock('@mj-studio/react-native-naver-map', () => {
  throw new Error("TurboModuleRegistry.getEnforcing(...): 'RNCNaverMapUtil' could not be found");
});

it('지도 부품이 없어도 터지지 않고 안내를 보여준다', async () => {
  await render(
    <PlaceMap
      places={[]}
      onCameraChanged={jest.fn()}
      onCameraIdle={jest.fn()}
      onPressPlace={jest.fn()}
    />
  );

  expect(screen.getByText('지도를 불러올 수 없어요')).toBeTruthy();
});
