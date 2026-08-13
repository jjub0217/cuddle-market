import {
  buildContent,
  imageMarkdown,
  MAX_CONTENT_LENGTH,
  remainingBodyLength,
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
