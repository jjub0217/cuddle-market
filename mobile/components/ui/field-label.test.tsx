import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { FieldLabel } from './field-label';

// 폼 이름표 하나를 여기서만 그린다. 웹은 RequiredLabel이 같은 일을 한다
// (src/components/commons/RequiredLabel.tsx) — 거기도 별표를 이름표 조각이 붙인다.
//
// 왜 시험이 필요한가: 11바퀴 실기기 확인에서 **앱에만 별표가 없던 것**이 드러났다.
// 웹에는 처음부터 있었는데 앱을 만들 때 빠뜨렸다. 조용히 다시 사라지지 않게 못을 박는다.

// ⚠️ @testing-library/react-native 14의 render는 기다려야 한다.
//    안 기다리면 «render function has not been called»가 뜬다.

it('기본은 별표를 안 붙인다 — 사진처럼 필수가 아닌 칸이 있다', async () => {
  await render(<FieldLabel text="상품 사진" />);

  expect(screen.getByText('상품 사진')).toBeTruthy();
  expect(screen.queryByText('*')).toBeNull();
});

it('required면 이름표 뒤에 별표를 붙인다', async () => {
  await render(<FieldLabel text="상품명" required />);

  expect(screen.getByText(/상품명/)).toBeTruthy();
  expect(screen.getByText('*')).toBeTruthy();
});
