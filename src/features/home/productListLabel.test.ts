import { describe, expect, it } from 'vitest'

import { productListLabel } from './productListLabel'

// 이 문구를 **두 곳**이 쓴다(StaticHomeFallback · ProductsSection). 여기서 한 번 지키면
// 둘이 어긋날 수가 없다 — 그러라고 함수로 뺐다.
describe('productListLabel', () => {
  it('검색 중이 아니면 개수만 적는다', () => {
    expect(productListLabel(61)).toBe('상품 61개')
  })

  it('검색 중이면 검색어를 앞에 적는다', () => {
    expect(productListLabel(1, '강아지')).toBe("'강아지' 검색 결과 1개")
  })

  it('검색어가 빈 글자면 개수만 적는다', () => {
    // `?keyword=` 처럼 값이 비어 오는 경우. 「'' 검색 결과」가 되면 안 된다.
    expect(productListLabel(61, '')).toBe('상품 61개')
  })

  it('검색어가 null 이면 개수만 적는다', () => {
    // extractProductSearchParams 는 없는 값을 null 로 준다(productQueryKeys.ts).
    expect(productListLabel(61, null)).toBe('상품 61개')
  })

  it('결과가 0개여도 검색어는 남긴다', () => {
    // 아래 「검색 결과가 없습니다」 빈 화면과 겹치지만, 무엇을 찾다 없었는지가 보여야 한다.
    expect(productListLabel(0, '강아지')).toBe("'강아지' 검색 결과 0개")
  })
})
