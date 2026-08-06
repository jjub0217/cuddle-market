import { render, screen } from '@testing-library/react-native';

import { EmptyState, ErrorState } from '@/components/list-states';

// 빈 화면·오류 화면의 **그림**을 지킨다.
//
// ⚠️ 왜 이 시험이 있나 — 전에는 이모지(🐾 ⚠️)를 썼다. 이모지는 기기마다 다르게 그려지고
//    브랜드 색을 못 입힌다. lucide 아이콘으로 바꿨는데, **370개 시험 중 아무도 그걸
//    안 봤다** — 이모지로 되돌려도 전부 통과했다(2026-08-06 마커로 확인).
//    여섯 화면이 함께 쓰는 조각이라 조용히 되돌아가면 알아채기 어렵다.
//
// 그림 자체는 못 읽으므로 **읽어주는 이름**으로 지킨다. 그 이름이 있으면 lucide 아이콘이
// 그려졌다는 뜻이고, 화면을 읽어주는 기능에도 도움이 된다.

describe('EmptyState', () => {
  it('기본은 발자국 그림이다', async () => {
    await render(<EmptyState />);

    expect(screen.getByLabelText('발자국')).toBeTruthy();
    expect(screen.queryByLabelText('검색 결과 없음')).toBeNull();
  });

  it('찾았는데 없을 때는 돋보기 그림이다', async () => {
    // 「아직 아무것도 없다」와 「찾는 것이 없다」는 다른 말이라 그림도 달라야 한다.
    await render(<EmptyState icon="search" title="검색 결과가 없습니다" />);

    expect(screen.getByLabelText('검색 결과 없음')).toBeTruthy();
    expect(screen.queryByLabelText('발자국')).toBeNull();
  });

  it('넘긴 문구를 그대로 쓴다', async () => {
    await render(<EmptyState title="검색 결과가 없습니다" description="다른 필터 조건으로 검색해보세요" />);

    expect(screen.getByText('검색 결과가 없습니다')).toBeTruthy();
    expect(screen.getByText('다른 필터 조건으로 검색해보세요')).toBeTruthy();
  });
});

describe('ErrorState', () => {
  it('경고 그림과 다시 시도 단추가 있다', async () => {
    await render(<ErrorState onRetry={jest.fn()} />);

    expect(screen.getByLabelText('오류')).toBeTruthy();
    expect(screen.getByText('다시 시도')).toBeTruthy();
  });
});
