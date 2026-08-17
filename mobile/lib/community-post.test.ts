import {
  buildContent,
  deletePost,
  imageMarkdown,
  MAX_CONTENT_LENGTH,
  remainingBodyLength,
  splitContent,
  updatePost,
} from './community-post';

// 글쓰기의 알맹이 — 사진을 **본문 마크다운으로** 넣는다.
//
// ⚠️ 서버가 목록 썸네일을 본문 첫 ![](주소) 에서 뽑는다
//    (PostListItemResponse.java:63). imageUrls 로 보내면 썸네일이 안 생긴다.

const A = 'https://cdn/a.webp';
const B = 'https://cdn/b.webp';

describe('본문 만들기', () => {
  it('사진이 없으면 본문 그대로다', () => {
    expect(buildContent('안녕하세요', [])).toBe('안녕하세요');
  });

  it('사진을 본문 끝에 이어 붙인다', () => {
    expect(buildContent('안녕하세요', [A, B])).toBe(
      `안녕하세요\n\n${imageMarkdown(A)}\n${imageMarkdown(B)}`
    );
  });

  it('본문이 비어도 사진만으로 만들 수 있다', () => {
    expect(buildContent('', [A])).toBe(imageMarkdown(A));
  });

  it('앞뒤 빈칸은 떼고 만든다', () => {
    expect(buildContent('  안녕  ', [])).toBe('안녕');
  });
});

describe('남은 글자 수', () => {
  it('사진이 없으면 한계에서 쓴 만큼만 뺀다', () => {
    expect(remainingBodyLength('12345', [])).toBe(MAX_CONTENT_LENGTH - 5);
  });

  // ⚠️ 이걸 안 하면 「999자 썼는데 등록이 안 된다」가 난다.
  //    사진 한 줄이 100자 안팎이라 다섯이면 500자를 먹는다.
  it('사진 몫을 뺀다', () => {
    const 사진몫 = buildContent('', [A, B]).length;
    expect(remainingBodyLength('12345', [A, B])).toBe(MAX_CONTENT_LENGTH - 5 - 사진몫 - 2);
  });

  it('넘치면 음수가 나온다 (화면이 막을 수 있게)', () => {
    const 긴글 = 'ㄱ'.repeat(MAX_CONTENT_LENGTH);
    expect(remainingBodyLength(긴글, [A])).toBeLessThan(0);
  });
});

describe('본문에서 사진 꺼내기', () => {
  it('사진이 없으면 글만 나온다', () => {
    expect(splitContent('안녕하세요')).toEqual({ body: '안녕하세요', imageUrls: [] });
  });

  it('끝에 붙은 사진을 꺼낸다', () => {
    expect(splitContent(`안녕하세요\n\n${imageMarkdown(A)}\n${imageMarkdown(B)}`)).toEqual({
      body: '안녕하세요',
      imageUrls: [A, B],
    });
  });

  it('사진만 있는 글도 나눈다', () => {
    expect(splitContent(imageMarkdown(A))).toEqual({ body: '', imageUrls: [A] });
  });

  // ⚠️ **이것이 의도한 대가다.** 웹에서 글 중간에 사진을 넣어 쓴 글을 앱에서 고치면
  //    사진이 끝으로 밀린다. 앱에는 마크다운 편집기가 없어 「글 중간」을 표현할 길이 없다.
  //    버그가 아니다 — 이 시험이 그것을 못 박는다(설계 문서 참고).
  it('중간에 있던 사진은 끝으로 밀린다 (의도한 대가)', () => {
    const 웹에서쓴글 = `앞글\n\n${imageMarkdown(A)}\n\n뒷글`;

    expect(splitContent(웹에서쓴글)).toEqual({ body: '앞글\n\n뒷글', imageUrls: [A] });
  });

  it('빈 글도 터지지 않는다', () => {
    expect(splitContent('')).toEqual({ body: '', imageUrls: [] });
  });

  // 꺼냈다 도로 합치면 사진 차례가 그대로여야 한다.
  it('꺼냈다 합치면 사진 차례가 유지된다', () => {
    const 원본 = buildContent('안녕하세요', [A, B]);
    const { body, imageUrls } = splitContent(원본);

    expect(buildContent(body, imageUrls)).toBe(원본);
  });

  it('대체 글자가 있는 사진도 꺼낸다', () => {
    expect(splitContent(`글\n\n![고양이](${A})`)).toEqual({ body: '글', imageUrls: [A] });
  });
});

// 서버 부르기는 fetch 를 갈아 끼워 본다. **products.test.ts 와 같은 방식**이다.
// ⚠️ 위쪽 순수 함수 시험들은 서버를 안 부르므로 이 beforeEach 가 방해되지 않는다.
const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  // 시험 환경엔 .env 가 안 실린다. 주소를 직접 준다(안 주면 apiFetch 가 막는다)
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ code: 'SUCCESS', data: null }) });
});

/** 요청에 실린 두 번째 인자(method·body)를 꺼낸다 */
function initOf(call: unknown[]): { method?: string; body?: string } {
  return (call[1] ?? {}) as { method?: string; body?: string };
}

describe('글 고치기·지우기', () => {
  it('고칠 때 PATCH 로 보낸다', async () => {
    await updatePost(39, { title: '제목', body: '내용', imageUrls: [A], boardType: 'QUESTION' });

    const [주소] = mockFetch.mock.calls[0];
    expect(String(주소)).toContain('/community/posts/39');
    expect(initOf(mockFetch.mock.calls[0]).method).toBe('PATCH');
  });

  // 글쓰기와 같은 규칙이다 — 사진은 본문에 들어가고 imageUrls 는 빈 배열이다.
  it('고칠 때도 사진을 본문에 넣는다', async () => {
    await updatePost(39, { title: '제목', body: '내용', imageUrls: [A], boardType: 'QUESTION' });

    const 보낸것 = JSON.parse(initOf(mockFetch.mock.calls[0]).body!);
    expect(보낸것.content).toBe(buildContent('내용', [A]));
    expect(보낸것.imageUrls).toEqual([]);
  });

  it('지울 때 DELETE 로 보낸다', async () => {
    await deletePost(39);

    const [주소] = mockFetch.mock.calls[0];
    expect(String(주소)).toContain('/community/posts/39');
    expect(initOf(mockFetch.mock.calls[0]).method).toBe('DELETE');
  });

  it('실패하면 서버 문구를 살린다', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: '내 글이 아니에요' }),
    });

    await expect(deletePost(39)).rejects.toThrow('내 글이 아니에요');
  });
});
