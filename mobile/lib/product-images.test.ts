import { makeMain, toImageUrls, type UploadSlot } from './product-images';

// 사진 목록을 다루는 규칙만 본다. 사진첩을 열거나 실제로 올리는 것은 실기기에서 본다.

function slot(key: string, url: string | null, failed = false): UploadSlot {
  return { key, localUri: `file:///${key}.jpg`, url, failed };
}

describe('대표 고르기', () => {
  // 웹은 끌어서 순서를 바꾸지만 앱은 눌러서 대표를 정한다.
  // 맨 앞이 곧 mainImageUrl이다.

  it('누른 사진이 맨 앞으로 온다', () => {
    const slots = [slot('a', 'A'), slot('b', 'B'), slot('c', 'C')];

    expect(makeMain(slots, 'c').map((s) => s.key)).toEqual(['c', 'a', 'b']);
  });

  it('나머지 차례는 그대로다', () => {
    const slots = [slot('a', 'A'), slot('b', 'B'), slot('c', 'C'), slot('d', 'D')];

    expect(makeMain(slots, 'c').map((s) => s.key)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('이미 맨 앞이면 그대로다', () => {
    const slots = [slot('a', 'A'), slot('b', 'B')];

    expect(makeMain(slots, 'a').map((s) => s.key)).toEqual(['a', 'b']);
  });

  it('없는 것을 누르면 그대로다', () => {
    const slots = [slot('a', 'A'), slot('b', 'B')];

    expect(makeMain(slots, 'zzz').map((s) => s.key)).toEqual(['a', 'b']);
  });
});

describe('서버에 보낼 모양으로', () => {
  it('맨 앞이 대표, 나머지가 추가', () => {
    const slots = [slot('a', 'A'), slot('b', 'B'), slot('c', 'C')];

    expect(toImageUrls(slots)).toEqual({ mainImageUrl: 'A', subImageUrls: ['B', 'C'] });
  });

  it('한 장이면 추가는 빈 배열', () => {
    expect(toImageUrls([slot('a', 'A')])).toEqual({ mainImageUrl: 'A', subImageUrls: [] });
  });

  it('사진이 없으면 대표가 null', () => {
    // 서버는 사진 없는 상품도 받는다(mainImageUrl의 @NotBlank이 주석 처리돼 있다)
    expect(toImageUrls([])).toEqual({ mainImageUrl: null, subImageUrls: [] });
  });

  it('아직 안 올라갔거나 실패한 것은 뺀다', () => {
    // 올라가는 중인 사진의 주소를 보내면 서버가 못 읽는다
    const slots = [slot('a', 'A'), slot('b', null), slot('c', null, true), slot('d', 'D')];

    expect(toImageUrls(slots)).toEqual({ mainImageUrl: 'A', subImageUrls: ['D'] });
  });

  it('맨 앞이 아직 안 올라갔으면 그다음 올라간 것이 대표다', () => {
    const slots = [slot('a', null), slot('b', 'B')];

    expect(toImageUrls(slots)).toEqual({ mainImageUrl: 'B', subImageUrls: [] });
  });
});
