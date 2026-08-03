import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { ChipField } from './chip-field';

// 값이 넷뿐인 칸은 시트로 감추지 않고 펼쳐 둔다. 웹 ProductStateFilter(variant="pill")와 같은 모양이다.
//
// 왜 시험을 두나: 11바퀴에 이 칸을 **시트로 만들었다가 되돌린** 자리다.
// 「앞뒤 칸과 같은 결」이라는 이유로 다시 시트로 바뀌기 쉬워서 못을 박는다.

const OPTIONS = [
  { code: 'NEW', label: '새 상품' },
  { code: 'LIKE_NEW', label: '거의 새것' },
  { code: 'USED', label: '사용감 있음' },
  { code: 'NEED_REPAIR', label: '수리 필요' },
] as const;

const NOOP = () => {};

// ⚠️ @testing-library/react-native 14의 render·fireEvent는 기다려야 한다.
//    fireEvent는 안 기다려도 오류가 안 나고 **옛 값을 준다** — 조용히 틀린 것을 통과시킨다.

it('고를 수 있는 값을 모두 펼쳐 보여준다 — 열어 보지 않아도 안다', async () => {
  await render(<ChipField label="상품 상태" value="" options={OPTIONS} onChange={NOOP} />);

  for (const option of OPTIONS) {
    expect(screen.getByText(option.label)).toBeTruthy();
  }
});

it('누르면 그 값의 코드를 알린다', async () => {
  const onChange = jest.fn();
  await render(<ChipField label="상품 상태" value="" options={OPTIONS} onChange={onChange} />);

  await fireEvent.press(screen.getByText('거의 새것'));

  expect(onChange).toHaveBeenCalledWith('LIKE_NEW');
});

it('고른 값만 「고름」으로 표시된다 — 읽어 주는 기기도 알 수 있게', async () => {
  await render(<ChipField label="상품 상태" value="USED" options={OPTIONS} onChange={NOOP} />);

  expect(screen.getByRole('radio', { name: '사용감 있음', selected: true })).toBeTruthy();
  expect(screen.getByRole('radio', { name: '새 상품', selected: false })).toBeTruthy();
});

it('필수면 이름표에 별표가 붙는다', async () => {
  await render(<ChipField label="상품 상태" required value="" options={OPTIONS} onChange={NOOP} />);

  expect(screen.getByText('*')).toBeTruthy();
});

it('오류 문구를 칸 아래에 보여준다', async () => {
  await render(
    <ChipField
      label="상품 상태"
      value=""
      options={OPTIONS}
      error="상품 상태를 선택해주세요"
      onChange={NOOP}
    />
  );

  expect(screen.getByText('상품 상태를 선택해주세요')).toBeTruthy();
});
