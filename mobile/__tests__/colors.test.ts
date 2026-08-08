import { colors } from '@/constants/colors';

// 색 토큰의 시험.
//
// 이 시험이 지키는 것은 **값이 웹과 어긋나지 않는 것**과 **표기가 섞이지 않는 것**이다.
// 화면이 올바른 토큰을 골랐는지는 여기서 못 잡는다 — 그건 사람이 봐야 한다.
describe('색 토큰', () => {
  // 웹 src/styles/tokens.colors.css 와 같은 값이어야 하는 것들.
  // 웹을 고치면 여기가 깨져서 「양쪽이 어긋났다」를 알려준다.
  it('웹에서 가져온 값이 웹과 같다', () => {
    expect(colors.selected).toBe('#825500'); // 웹 --color-primary-container
    expect(colors.brandText).toBe('#633F00'); // 웹 --color-primary-700
    expect(colors.brandSurface).toBe('#FAF3E6'); // 웹 --color-primary-50
    expect(colors.danger).toBe('#C91D1D'); // 웹 --color-danger-500
    expect(colors.success).toBe('#15803D'); // 웹 --color-success-500
    expect(colors.favorite).toBe('#FC8181'); // 웹 --color-heart-red
    expect(colors.badgeSell).toBe('#2563EB'); // 웹 --color-badge-sell-fg
    expect(colors.badgeRequest).toBe('#EA580C'); // 웹 --color-badge-request-fg
    expect(colors.outlineBrand).toBe('#D4C4B2'); // 웹 --color-outline-variant
    expect(colors.warningSurface).toBe('#FFF5E0'); // 웹 --color-warning-container
  });

  it('모든 값이 대문자 6자리 표기다', () => {
    // 표기가 섞이면(#fff / #FFFFFF) 같은 색인데 다른 색처럼 보인다.
    for (const value of Object.values(colors)) {
      expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('한 색에 이름이 둘이지 않다', () => {
    // 같은 값에 이름이 둘이면 어느 쪽을 써야 할지 매번 헷갈린다.
    // 일부러 겹쳐 둔 값만 예외로 둔다 — 뜻이 달라 따로 부르는 것이 맞다.
    //   #111827  onSurface(글자) = action(단추 바탕)
    //   #FFFFFF  surface(바탕) = onAction = onSelected = onDanger(진한 바탕 위 글자)
    //   #825500  selected(고른 것의 바탕) = accent(눌러서 뭔가 하는 글자)
    //   #633F00  action(끝내는 단추 바탕) = brandText(브레드크럼 글자)
    //   #2563EB  badgeSell(판매 뱃지 글자) = link(본문 링크)
    const 겹쳐도_되는_값 = ['#111827', '#FFFFFF', '#825500', '#633F00', '#2563EB'];
    const 먼저_본_이름 = new Map<string, string>();

    for (const [name, value] of Object.entries(colors)) {
      if (겹쳐도_되는_값.includes(value)) continue;
      expect(먼저_본_이름.get(value)).toBeUndefined();
      먼저_본_이름.set(value, name);
    }
  });
});
