import { fireEvent, render, screen } from '@testing-library/react-native';

import { PlaceSheet } from '@/components/places/place-sheet';
import type { PlaceListItem } from '@/lib/places/types';

// 시트가 「무엇을 보여주는가」를 잡는다.
//
// ⚠️ **끌어올리는 동작 자체는 여기서 못 잡는다.** 제스처는 실기기의 손가락 입력과
//    네이티브 쪽 계산이 얽혀 있어 jest 안에서 흉내 내도 진짜와 다르게 돈다.
//    억지로 통과하는 시험을 만들면 「된다」는 거짓 안심만 남는다.
//    → 끌리는지는 실기기 확인 목록에 넣었다(계획서 Task 3).

function 장소(부분: Partial<PlaceListItem> = {}): PlaceListItem {
  return {
    id: 1,
    category: 'HOSPITAL',
    name: '행복동물병원',
    address: '서울시 중구 세종대로 110',
    latitude: 37.5666,
    longitude: 126.9784,
    isRecommended: false,
    imageUrl: null,
    reviewSummary: null,
    detail: null,
    ...부분,
  };
}

describe('PlaceSheet', () => {
  it('장소들이 목록에 나온다', async () => {
    await render(
      <PlaceSheet
        places={[장소(), 장소({ id: 2, name: '멍멍카페', category: 'CAFE' })]}
        loading={false}
        onPressPlace={jest.fn()}
      />
    );

    expect(screen.getByText('행복동물병원')).toBeTruthy();
    expect(screen.getByText('멍멍카페')).toBeTruthy();
  });

  it('항목을 누르면 그 장소의 id 로 알린다', async () => {
    const 눌림 = jest.fn();
    await render(
      <PlaceSheet places={[장소({ id: 42 })]} loading={false} onPressPlace={눌림} />
    );

    await fireEvent.press(screen.getByText('행복동물병원'));

    expect(눌림).toHaveBeenCalledWith(42);
  });

  it('불러오는 중이면 그렇다고 알린다', async () => {
    await render(<PlaceSheet places={[]} loading onPressPlace={jest.fn()} />);

    expect(screen.getByText('불러오는 중')).toBeTruthy();
  });

  it('불러오는 중에는 「없어요」를 띄우지 않는다', async () => {
    // 아직 답이 안 왔는데 「없어요」가 뜨면 있는 동네도 없는 것처럼 보인다.
    await render(<PlaceSheet places={[]} loading onPressPlace={jest.fn()} />);

    expect(screen.queryByText('이 지역에는 아직 없어요')).toBeNull();
  });

  it('다 불러왔는데 비었으면 다른 동네를 권한다', async () => {
    await render(<PlaceSheet places={[]} loading={false} onPressPlace={jest.fn()} />);

    expect(screen.getByText('이 지역에는 아직 없어요')).toBeTruthy();
    expect(screen.getByText('지도를 옮겨 다른 동네를 찾아보세요')).toBeTruthy();
  });

  it('끌 수 있는 손잡이가 있다', async () => {
    await render(<PlaceSheet places={[장소()]} loading={false} onPressPlace={jest.fn()} />);

    expect(screen.getByLabelText('목록 끌어올리기')).toBeTruthy();
  });
});
