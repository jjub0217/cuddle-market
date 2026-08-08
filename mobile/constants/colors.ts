/**
 * 앱 색 토큰.
 *
 * 이름은 웹 `src/styles/tokens.colors.css` 의 체계를 따른다 —
 * 두 저장소를 오갈 때 말이 통하게 하려는 것이다.
 * `on-` 은 「이 바탕 위에 올라가는 색」이라는 뜻이다.
 *
 * ⚠️ 여기 밖에서 색을 직접 적지 않는다. eslint 가 막는다.
 *    19바퀴(#786)에 화면에 흩어져 있던 567개를 걷어냈다.
 *
 * 어두운 모드는 아직 없다. 화면들이 흰 바탕을 못 박고 있어 토큰만 갈라도
 * 닿는 데가 없다. 나중에 붙일 때를 위해 평평한 객체 하나로 둔다.
 */
export const colors = {
  // ── 바탕
  surface: '#FFFFFF', // 화면·카드 바탕
  surfaceMuted: '#F9FAFB', // 한 단계 눈치채운 바탕
  surfaceSunken: '#F3F4F6', // 움패인 바탕 (입력칸·구역)
  surfaceCream: '#FAF8F3', // 크림 바탕 (프로필 수정)

  // ── 글자 (진한 것부터 다섯 단. Tailwind gray 900·700·600·500·400 자리다)
  onSurface: '#111827', // 본문·제목
  onSurfaceStrong: '#374151', // 진한 보조 글자
  onSurfaceMedium: '#4B5563', // 중간 글자
  onSurfaceMuted: '#6B7280', // 보조 글자
  onSurfaceSubtle: '#9CA3AF', // 안내글·비활성

  // ── 선
  outline: '#D1D5DB', // 칸 테두리
  outlineVariant: '#E5E7EB', // 구분선
  outlineBrand: '#D4C4B2', // 칩·툴바·검색칸 테두리 (웹 --color-outline-variant)

  // ── 단추·고른 것
  // 「끝내는 단추」와 「여럿 중 고른 것」은 뜻이 달라 이름을 나눴다.
  // 값은 웹 primary-700 / primary-600 을 그대로 가져왔다.
  //
  // ⚠️ 두 값의 대비는 1.45:1 이라 **나란히 놓으면 눈으로 거의 같다.**
  //    그래도 괜찮은 이유는 칩과 단추가 모양·크기·자리가 달라 색으로 가를 일이
  //    없어서다. 색이 구분을 맡는 게 아니라 「둘 다 브랜드 갈색」인 것이 맞다.
  //
  // 19바퀴(#786)에 먹색(#111827)에서 옮겼다. 브랜드가 갈색인데 주 단추만
  // 먹색이면 브랜드 색을 안 보여주는 셈이고, 웹 주 단추와도 어긋났다.
  action: '#633F00', // 로그인·가입·신고·확인대화·저장 (웹 primary-700)
  onAction: '#FFFFFF', // 9.37:1 — WCAG AA 넉넉히 넘는다
  selected: '#825500', // 필터 칩·탭·툴바·상태 칩 (웹 primary-600)
  onSelected: '#FFFFFF',
  // selected 와 값이 같지만 이름을 나눴다. 같은 갈색이 바탕일 때와 글자일 때
  // 하는 일이 다르다 — 「고른 것」과 「눌러서 뭔가 하는 글자」다.
  // color: colors.accent / backgroundColor: colors.selected 로 갈라 읽힌다.
  accent: '#825500', // 「모두 읽음」·「취소」·댓글 수·멘션·정렬 이름

  // ── 알림 계열
  // #DC2626 이 아니다 — 웹이 「흰 바탕 4.5:1 borderline」이라며 뺀 값이라
  // 앱만 붙들고 있을 이유가 없다 (tokens.colors.css:110).
  danger: '#C91D1D',
  onDanger: '#FFFFFF',
  dangerSurface: '#FEE2E2',
  success: '#15803D', // 확인 통과 (웹 --color-success-500)
  warningSurface: '#FFF5E0', // 빈 목록 아이콘 바탕 (웹 --color-warning-container)

  // ── 그 밖
  favorite: '#FC8181', // 찜 하트 (웹 --color-heart-red)
  rating: '#FBBF24', // 별점
  black: '#000000', // 사진 뒷바탕·그림자

  // ── 브랜드
  brandSurface: '#FAF3E6', // 판매자 카드 바탕 (웹 primary-50)
  brandText: '#633F00', // 브랜드 글자 (웹 primary-700)
  badgeSell: '#2563EB',
  badgeSellBg: '#EFF6FF',
  // badgeSell 과 값이 같지만 뜻이 다르다 — 뱃지가 아니라 눌러서 밖으로 나가는 글자다.
  link: '#2563EB', // 커뮤니티 본문의 링크
  badgeRequest: '#EA580C',
  badgeRequestBg: '#FFF7ED',

  // 브랜드 갈색 스케일. 웹 primary-* 와 단계 이름을 맞췄다.
  //
  // 넷 다 한 군데씩만 쓰이는데, 쓰이는 자리의 역할이 저마다 달라(사진 자리·댓글
  // 표시·빈 목록·알림 줄) 넷을 묶을 역할 이름이 없다. 억지로 지으면 그 한 줄
  // 전용 이름이 되어, 다음에 다른 화면이 같은 갈색을 쓸 때 또 지어야 한다.
  // 「값 이름은 이점이 없다」는 말은 역할이 하나뿐일 때 맞는 말이다.
  //
  // brand50 은 만들지 않았다 — brandSurface 와 값이 같아 한 색에 이름이 둘이 된다.
  brand100: '#F4E3BF', // 프로필 사진 자리 바탕
  brand200: '#ECC88E', // 댓글 작성자 표시 바탕
  brand300: '#E2A958', // 빈 목록 아이콘
  brand500: '#B06F15', // 알림 줄 바탕
} as const;
