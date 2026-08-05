// 부품이 없는 폰을 흉내 낸다 — require 가 터지게 만들고, 앱이 안 죽는지 본다.
jest.mock('@mj-studio/react-native-naver-map', () => {
  throw new Error("TurboModuleRegistry.getEnforcing(...): 'RNCNaverMapUtil' could not be found");
});

import { render, screen } from '@testing-library/react-native';
import PlaceMap from '@/components/places/place-map';

it('지도 부품이 없어도 터지지 않고 안내를 보여준다', async () => {
  await render(
    <PlaceMap places={[]} onCameraChanged={jest.fn()} onCameraIdle={jest.fn()} onPressPlace={jest.fn()} />
  );
  expect(screen.getByText('지도를 불러올 수 없어요')).toBeTruthy();
});
