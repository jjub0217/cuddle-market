import { render, screen } from '@testing-library/react-native';
import React from 'react';
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

describe('PostBody', () => {
  it('마크다운의 제목·굵게·목록·링크를 그린다', async () => {
    await render(<PostBody content={SAMPLE} />);

    expect(screen.getByText('제목')).toBeTruthy();
    expect(screen.getByText('굵게')).toBeTruthy();
    expect(screen.getByText('목록 하나')).toBeTruthy();
    expect(screen.getByText('링크')).toBeTruthy();
    expect(screen.getByText('인용문')).toBeTruthy();
  });

  // 라이브러리가 주는 사진 조각은 끝없이 다시 그리는 고리가 있어 우리 것으로 바꿔 끼웠다.
  // 이 시험은 그 바꿔치기가 살아 있는지도 같이 지킨다 — 되돌리면 여기서 멈춘다.
  it('본문의 사진을 우리 사진 조각으로 그린다', async () => {
    await render(<PostBody content={SAMPLE} />);

    expect(screen.getAllByTestId('post-body-image')).toHaveLength(1);
  });

  it('빈 본문에도 터지지 않는다', async () => {
    await expect(render(<PostBody content="" />)).resolves.toBeTruthy();
  });
});
