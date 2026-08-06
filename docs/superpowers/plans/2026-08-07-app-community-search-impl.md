# 앱 커뮤니티 검색·정렬 구현 계획 (#857)

> 설계: `docs/superpowers/specs/2026-08-07-app-community-search-design.md`
> 브랜치: `feature/857--app-community-search`

**만드는 것** — 앱 커뮤니티 목록에 검색창과 정렬 줄을 더한다. 서버는 이미 다 받으므로
앱만 고친다.

**어떻게** — 목록을 조각으로 빼지 않고 `index.tsx` 안에서 더한다. 검색은 **같은 화면**에서
하고(상품처럼 별도 화면이 아니다), 정렬은 나란한 글자 단추 셋이다.

---

## 못 박아 둘 것 — 조각들이 주고받는 모양

```ts
// mobile/lib/community.ts — 지금은 인자 둘인데 객체로 바꾼다
export interface PostListParams {
  boardType: BoardType;
  page: number;
  /** 검색어. 빈 값이면 안 싣는다 */
  keyword?: string;
  /** 'latest'(기본) | 'views' | 'comments' */
  sortBy?: string;
}
export async function fetchPosts(params: PostListParams): Promise<PostPage>
```

⚠️ **`searchType` 은 params 에 안 넣는다.** 늘 `title_content` 라 고를 일이 없다 —
`fetchPosts` 안에서 못 박는다(설계 §2).

⚠️ **빈 값은 아예 안 싣는다.** 상품에서 정한 규칙 그대로.

---

## Task 1: 서버로 보내는 길

**파일**
- 고침: `mobile/lib/community.ts`
- 고침: `mobile/lib/community.test.ts`

- [ ] **1-1.** 시험 먼저. `community.test.ts` 의 `describe('fetchPosts')` 에 넣는다

```ts
it('검색어를 주면 searchType 과 함께 싣는다', async () => {
  apiFetch.mockResolvedValue(okJson({ data: { content: [], hasNext: false } }));

  await fetchPosts({ boardType: 'QUESTION', page: 0, keyword: '사료' });

  const url = apiFetch.mock.calls[0][0] as string;
  // ⚠️ 검색 종류는 늘 title_content 다. 고르는 자리를 안 뒀다(설계 §2)
  expect(url).toContain('searchType=title_content');
  expect(url).toContain('keyword=%EC%82%AC%EB%A3%8C');
});

it('검색어가 없으면 searchType 도 안 싣는다', async () => {
  apiFetch.mockResolvedValue(okJson({ data: { content: [], hasNext: false } }));

  await fetchPosts({ boardType: 'QUESTION', page: 0 });

  const url = apiFetch.mock.calls[0][0] as string;
  expect(url).not.toContain('searchType');
  expect(url).not.toContain('keyword');
});

it('정렬을 싣는다', async () => {
  apiFetch.mockResolvedValue(okJson({ data: { content: [], hasNext: false } }));

  await fetchPosts({ boardType: 'INFO', page: 0, sortBy: 'views' });

  expect(apiFetch.mock.calls[0][0]).toContain('sortBy=views');
});

it('정렬을 안 주면 sortBy 를 안 싣는다 — 서버 기본이 latest 다', async () => {
  apiFetch.mockResolvedValue(okJson({ data: { content: [], hasNext: false } }));

  await fetchPosts({ boardType: 'QUESTION', page: 0 });

  expect(apiFetch.mock.calls[0][0]).not.toContain('sortBy');
});
```

- [ ] **1-2.** 돌려서 **깨지는지** 본다

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile && npx jest lib/community
```
기대: 새 시험 넷이 실패. 기존 시험도 `fetchPosts(boardType, page)` 시그니처가 바뀌어 깨진다

- [ ] **1-3.** `fetchPosts` 를 객체 받게 고치고 조건을 싣는다

```ts
/** 검색은 늘 「제목+내용」이다. 서버는 title·writer 도 받지만 고르는 자리를 안 뒀다(설계 §2) */
const SEARCH_TYPE = 'title_content';

export async function fetchPosts({
  boardType,
  page,
  keyword,
  sortBy,
}: PostListParams): Promise<PostPage> {
  const query = new URLSearchParams({
    boardType,
    page: String(page),
    size: String(PAGE_SIZE),
  });

  // ⚠️ 빈 값은 아예 안 싣는다. 빈 글자를 보내면 서버가 그런 조건을 찾는다
  if (keyword) {
    query.set('searchType', SEARCH_TYPE);
    query.set('keyword', keyword);
  }
  if (sortBy) query.set('sortBy', sortBy);

  const res = await apiFetch(`/community/posts?${query.toString()}`);
  …
}
```

- [ ] **1-4.** 기존 호출부를 고친다 — `index.tsx` 의 `fetchPosts(boardType, pageParam)` 하나뿐이다
      (`grep -rn "fetchPosts(" mobile/` 로 확인)
- [ ] **1-5.** 다시 돌려 초록. 커밋

---

## Task 2: 정렬 줄

**파일**
- 만듦: `mobile/components/community/community-sort-row.tsx` · `.test.tsx`

- [ ] **2-1.** 값을 웹에서 가져온다. `src/constants/constants.ts:171` 의 `COMMUNITY_SORT_TYPE`

```ts
/** 웹 COMMUNITY_SORT_TYPE 을 그대로 옮겼다 — 웹에서 바뀌면 여기도 바꾼다.
 *  ⚠️ 서버에는 oldest(오래된 순)도 있지만 웹이 안 쓴다. 우리도 안 쓴다(설계 §2) */
const SORT_TYPES = [
  { id: 'latest', label: '최신순' },
  { id: 'views', label: '조회 순' },
  { id: 'comments', label: '댓글 순' },
] as const;
```

- [ ] **2-2.** 시험 먼저. ⚠️ `render`·`fireEvent` 를 **기다린다**(mobile/AGENTS.md).
      누를 때는 글자가 아니라 **표식(testID)**으로 — 글자는 단추 안쪽이라 누름이 안 올라갈 때가 있다

```tsx
it('셋이 다 보인다', async () => {
  await render(<CommunitySortRow sortBy="latest" onChange={jest.fn()} />);

  expect(screen.getByText('최신순')).toBeTruthy();
  expect(screen.getByText('조회 순')).toBeTruthy();
  expect(screen.getByText('댓글 순')).toBeTruthy();
});

it('누르면 그 id 로 알린다', async () => {
  const onChange = jest.fn();
  await render(<CommunitySortRow sortBy="latest" onChange={onChange} />);

  await fireEvent.press(screen.getByTestId('community-sort-views'));

  expect(onChange).toHaveBeenCalledWith('views');
});

it('지금 고른 것이 선택 상태로 표시된다', async () => {
  await render(<CommunitySortRow sortBy="comments" onChange={jest.fn()} />);

  expect(screen.getByRole('button', { name: '댓글 순', selected: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: '최신순', selected: false })).toBeTruthy();
});
```

- [ ] **2-3.** 조각을 만든다. 모양은 웹과 같다 — 나란히 놓고 사이에 세로 구분선

```tsx
interface Props {
  sortBy: string;
  onChange: (next: string) => void;
}

export function CommunitySortRow({ sortBy, onChange }: Props) { … }
```

- 고른 것: 브라운 `#825500` + 굵게. 나머지: `#4B5563` 보통 — 앱의 다른 곳과 같은 값
- 구분선: 웹은 `h-3 w-px` 다. 앱에서는 높이 12 · 너비 1 · `#E5E7EB`
- 각 단추에 `testID={`community-sort-${id}`}` 와 `accessibilityState={{ selected }}`

- [ ] **2-4.** 시험 초록 확인. 커밋

---

## Task 3: 검색 입력칸

**파일**
- 만듦: `mobile/components/community/post-search-input.tsx` · `.test.tsx`

⚠️ **기존 `products/search-bar-header.tsx` 를 못 쓴다.** 그건 뒤로가기가 필수인 **헤더**이고,
**빈 검색어를 안 넘긴다**(`if (!normalized) return`). 커뮤니티는 검색어를 지우면 전체 목록으로
돌아와야 하므로 그 규칙과 어긋난다.

- [ ] **3-1.** 시험 먼저

```tsx
it('확인 키를 누르면 다듬어진 검색어로 알린다', async () => {
  const onSubmit = jest.fn();
  await render(<PostSearchInput keyword="" onSubmit={onSubmit} />);

  await fireEvent.changeText(screen.getByTestId('post-search-input'), '  강아지 사료  ');
  await fireEvent(screen.getByTestId('post-search-input'), 'submitEditing');

  // 앞뒤 공백을 다듬는다 — lib/search.ts 의 normalizeKeyword 를 쓴다
  expect(onSubmit).toHaveBeenCalledWith('강아지 사료');
});

it('비운 채로 확인하면 빈 글자로 알린다 — 전체 목록으로 돌아가는 길이다', async () => {
  // ⚠️ products/search-bar-header 와 다른 점이다. 거긴 빈 검색어를 안 넘긴다
  const onSubmit = jest.fn();
  await render(<PostSearchInput keyword="사료" onSubmit={onSubmit} />);

  await fireEvent.changeText(screen.getByTestId('post-search-input'), '');
  await fireEvent(screen.getByTestId('post-search-input'), 'submitEditing');

  expect(onSubmit).toHaveBeenCalledWith('');
});

it('밖에서 검색어가 바뀌면 칸에 따라 들어온다', async () => {
  // 탭을 바꾸면 검색어가 풀린다(설계 §4). 그때 칸도 비어야 한다
  const view = await render(<PostSearchInput keyword="사료" onSubmit={jest.fn()} />);

  await view.rerender(<PostSearchInput keyword="" onSubmit={jest.fn()} />);

  expect(screen.getByTestId('post-search-input').props.value).toBe('');
});
```

- [ ] **3-2.** 조각을 만든다

```tsx
interface Props {
  /** 지금 걸린 검색어. 밖에서 바뀌면 칸도 따라간다 */
  keyword: string;
  /** 확인 키를 눌렀을 때. **빈 글자도 넘긴다** — 전체 목록으로 돌아가는 길이다 */
  onSubmit: (keyword: string) => void;
}

export function PostSearchInput({ keyword, onSubmit }: Props) { … }
```

- 문구는 웹에서 가져온다 — `CommunityPage.tsx:219` 의 `궁금한 내용을 검색해보세요`
- 왼쪽에 돋보기(`Search`, lucide). 글자가 있으면 오른쪽에 지우기(`X`)
- `returnKeyType="search"` · `testID="post-search-input"`

⚠️ **`keyword` 가 밖에서 바뀌면 칸도 따라가야 한다.** 탭을 바꾸면 검색어가 풀리는데 칸에
옛 글자가 남으면 「지웠는데 그대로」로 보인다. 그렇다고 `value={keyword}` 로 바로 묶으면
**글자를 칠 수가 없다** — 확인 키를 눌러야 밖의 값이 바뀌기 때문이다. 안에 따로 들고 있다가
밖이 바뀔 때만 맞춘다.

```tsx
export function PostSearchInput({ keyword, onSubmit }: Props) {
  // 치는 동안의 글자. 확인 키를 눌러야 밖으로 나간다.
  const [text, setText] = useState(keyword);

  // 밖에서 바뀌면 따라간다(탭 전환 등). 안에서 친 글자는 안 건드린다 —
  // keyword 가 그대로면 이 효과가 안 돈다.
  useEffect(() => {
    setText(keyword);
  }, [keyword]);

  const submit = () => {
    // 빈 글자도 넘긴다 — 전체 목록으로 돌아가는 길이다
    onSubmit(normalizeKeyword(text));
  };

  const clear = () => {
    setText('');
    onSubmit('');   // 지우기는 누르는 즉시 반영한다. 확인 키를 또 누르게 하지 않는다
  };
  …
}
```

⚠️ 지우기(`X`)는 **누르는 즉시** 반영한다. 「지웠는데 목록이 그대로」가 되면 안 된다 —
16바퀴에서 초기화가 그 문제로 걸렸다.

- [ ] **3-3.** 시험 초록 확인. 커밋

---

## Task 4: 화면에 붙인다

**파일**
- 고침: `mobile/app/(tabs)/(community)/index.tsx`
- 만듦: `mobile/app/(tabs)/(community)/index.test.tsx`

- [ ] **4-1.** 상태를 더한다

```tsx
const [boardType, setBoardType] = useState<BoardType>('QUESTION');
const [keyword, setKeyword] = useState('');
const [sortBy, setSortBy] = useState('latest');
```

- [ ] **4-2.** ⚠️ **탭을 바꾸면 검색어·정렬을 푼다**(설계 §4 — 웹이 그렇다)

```tsx
const changeBoardType = (next: BoardType) => {
  setBoardType(next);
  setKeyword('');
  setSortBy('latest');
};
```

- [ ] **4-3.** ⚠️ **`queryKey` 에 조건을 다 넣는다.** 하나라도 빠지면 그 조건만 안 먹고
      뒤섞인 목록이 된다(16바퀴에서 겪었다)

```tsx
queryKey: ['communityPosts', boardType, keyword, sortBy],
queryFn: ({ pageParam }) => fetchPosts({ boardType, page: pageParam, keyword, sortBy }),
```

- [ ] **4-4.** 화면을 짠다. **고정 두 줄 + 스크롤되는 정렬 줄**

```
[질문 있어요][정보 공유]      FlatList 밖 (고정)
[🔍 궁금한 내용을 검색…]       FlatList 밖 (고정)
────────────────────────
최신순 | 조회 순 | 댓글 순     ListHeaderComponent (스크롤되어 사라진다)
게시글…
```

⚠️ **`SectionList` 를 쓰지 않는다.** 붙일 줄이 없다(설계 §3). 지금 `FlatList` 그대로 간다.

⚠️ **빈 화면·오류일 때도 칩 줄과 검색창이 보여야 한다.** 둘 다 `FlatList` 밖이라 저절로
   보이지만, 정렬 줄은 헤더라 목록이 없으면 안 그려진다 — 그건 괜찮다(고를 게 없으니).

- [ ] **4-5.** 빈 화면 문구를 가른다

```tsx
// 검색해서 0건인지, 원래 글이 없는지에 따라 다르다.
// ⚠️ 웹에는 앞엣것이 없다 — 검색해도 「첫 번째 이야기를 나눠보세요!」가 그대로 뜬다.
//    검색 결과가 없는데 그 문구는 어색해서 앱에서 갈랐다(상품도 그렇게 했다).
if (posts.length === 0) {
  return keyword ? (
    <EmptyState icon="search" title="검색 결과가 없습니다" description="다른 검색어로 찾아보세요" />
  ) : (
    <EmptyState title="아직 게시글이 없어요." description="첫 번째 이야기를 나눠보세요!" />
  );
}
```

- [ ] **4-6.** 시험. ⚠️ `@tanstack/react-query` 를 쓰므로 `QueryClientProvider` 로 감싼다
      (`product-list-view.test.tsx` 의 `감싸기` 를 본으로)

덮을 것:
- 검색어를 치면 그 조건으로 서버를 부른다
- 검색어를 지우면 조건 없이 다시 부른다
- 정렬을 고르면 그 값으로 부른다
- **탭을 바꾸면 검색어·정렬이 풀린 채로 부른다**
- 검색해서 0건이면 「검색 결과가 없습니다」, 조건 없이 0건이면 「아직 게시글이 없어요」

- [ ] **4-7.** 저장소 루트에서 게이트. 커밋

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile
```

---

## Task 5: 웹의 죽은 상수에 주석

**파일**
- 고침: `src/constants/constants.ts` (`COMMUNITY_SEARCH_TYPE`)

⚠️ **기능 변경이 아니다.** 이 상수를 아무도 안 쓰는데 있어서, #857 이슈 본문이
「웹은 이걸 쓴다」로 잘못 적혔고 서버까지 열어보고서야 밝혀졌다. 다음 사람이 또 속지 않게 한다.

- [ ] **5-1.** 주석을 단다

```ts
/**
 * 커뮤니티 검색 종류.
 *
 * ⚠️ **아무 데서도 안 쓴다.** 웹도 앱도 늘 `title_content`(제목+내용)로만 찾는다
 * (`CommunityPage.tsx` 의 `SEARCH_TYPE` 이 못 박혀 있다).
 *
 * 서버는 셋 다 받고 진짜로 돈다(`PostRepositoryCustomImpl.java:56-72`). 다만 고르는 자리를
 * 안 뒀다 — 「제목」은 「제목+내용」의 부분집합이고, 「작성자로 찾기」는 프로필 화면이 있는
 * 일이라서다(#857 설계 §2). 필요해지면 웹·앱에 함께 넣는다.
 */
export const COMMUNITY_SEARCH_TYPE = [ … ]
```

- [ ] **5-2.** 웹 게이트. 커밋

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate
```

---

## Task 6: 실기기 확인

게이트가 초록이어도 따로 봐야 한다.

- [ ] 검색어를 치면 목록이 좁혀진다
- [ ] **검색어를 지우면 원래대로 돌아온다**
- [ ] **질문 ↔ 정보를 오가면 검색어·정렬이 풀린다** (칸도 비워진다)
- [ ] 정렬만 바꿀 때는 검색어가 남는다
- [ ] 정렬 셋이 다 먹는다
- [ ] 스크롤하면 정렬 줄은 사라지고 칩 줄·검색창은 남는다
- [ ] 검색해서 0건이면 「검색 결과가 없습니다」가 뜬다
- [ ] **게시글이 몇 장 보이는지** — 고정 두 줄이 세로를 너무 먹지 않는지

---

## 함정 (설계 §7 요약)

```
죽은 상수         웹 COMMUNITY_SEARCH_TYPE 은 아무도 안 쓴다
서버는 400을 안 준다  잘못된 searchType·sortBy 는 조용히 무시된다 — 오타가 안 드러난다
빈 값             안 싣는다. 빈 글자를 보내면 서버가 그런 조건을 찾는다
queryKey          조건을 다 넣는다. 하나라도 빠지면 뒤섞인 목록이 된다
검색해서 0건       웹 문구를 그대로 쓰면 「첫 번째 이야기를 나눠보세요」가 뜬다
검색창 재사용      products/search-bar-header 는 빈 검색어를 안 넘긴다 — 새로 만든다
시험의 await      render·rerender·fireEvent 셋 다 기다린다. 안 하면 조용히 틀린 게 통과한다
```
