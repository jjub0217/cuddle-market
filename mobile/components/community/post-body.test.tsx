import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PostBody } from './post-body';

// 라이브러리(react-native-marked)가 이 환경에서 진짜 도는지 보는 시험이다.
// 타입체크는 「모양이 맞다」만 말해 준다 — 여는 순간 터지는지는 그려 봐야 안다.
// 자세한 생김새(색·굵기)는 실기기로 본다. 여기선 조각이 나오는지까지만 본다.
//
// ⚠️ @testing-library/react-native 14의 render는 기다려야 한다(async).
//    안 기다리면 화면이 아직 없어서 «render function has not been called»가 뜬다.

const SAMPLE = [
  '# 제목',
  '',
  '**굵게** 와 *기울임* 과 `코드`.',
  '',
  '- 목록 하나',
  '- 목록 둘',
  '',
  '[링크](https://cuddle-market.vercel.app)',
  '',
  '![사진](https://picsum.photos/400/200)',
  '',
  '> 인용문',
].join('\n');

// 확대창(PhotoViewer)이 안전영역(기기 바) 값을 쓴다. 안 감싸면 「No safe area value
// available」로 죽는다 — photo-viewer.test.tsx 와 같은 방식이다.
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};
function Wrapper({ children }: { children: React.ReactNode }) {
  return <SafeAreaProvider initialMetrics={METRICS}>{children}</SafeAreaProvider>;
}

describe('PostBody', () => {
  it('마크다운의 제목·굵게·목록·링크를 그린다', async () => {
    await render(<PostBody content={SAMPLE} />, { wrapper: Wrapper });

    expect(screen.getByText('제목')).toBeTruthy();
    expect(screen.getByText('굵게')).toBeTruthy();
    expect(screen.getByText('목록 하나')).toBeTruthy();
    expect(screen.getByText('링크')).toBeTruthy();
    expect(screen.getByText('인용문')).toBeTruthy();
  });

  // 라이브러리가 주는 사진 조각은 끝없이 다시 그리는 고리가 있어 우리 것으로 바꿔 끼웠다.
  // 이 시험은 그 바꿔치기가 살아 있는지도 같이 지킨다 — 되돌리면 여기서 멈춘다.
  it('본문의 사진을 우리 사진 조각으로 그린다', async () => {
    await render(<PostBody content={SAMPLE} />, { wrapper: Wrapper });

    expect(screen.getAllByTestId('post-body-image')).toHaveLength(1);
  });

  it('빈 본문에도 터지지 않는다', async () => {
    await expect(render(<PostBody content="" />, { wrapper: Wrapper })).resolves.toBeTruthy();
  });

  // 사진을 누르면 확대창이 뜬다(#904).
  //
  // ⚠️ 사진마다 이름이 같다(post-photo). 그리개(PostRenderer.image)가 몇 번째인지
  //    안 알려 줘서다. 그래서 getAllByTestId 로 받아 첫 장을 집는다.
  it('본문 사진을 누르면 확대창이 열린다', async () => {
    await render(<PostBody content={SAMPLE} />, { wrapper: Wrapper });

    expect(screen.queryByLabelText('닫기')).toBeNull();

    await fireEvent.press(screen.getAllByTestId('post-photo')[0]);

    expect(screen.getByLabelText('닫기')).toBeTruthy();
  });
});
