import type { ProductResponse } from '@cuddle/shared'

// 홈 상품 목록 데이터 소스.
// 인증 없는 공개 조회라 axios/토큰 없이 순수 fetch만 쓴다(요구사항 §6.3-3).
// 성공/오류 판정은 응답 body의 code가 아니라 HTTP status(res.ok) 기준.

// EXPO_PUBLIC_* 환경변수는 빌드 시 인라인된다(.env에 주입됨).
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

/**
 * 상품 목록 한 페이지를 가져온다.
 * `GET {base}/products/search?page={page}&size=20`
 * @param page 0부터 시작하는 페이지 번호
 * @returns 응답의 data (무한스크롤에 content + hasNext 둘 다 필요)
 */
export async function fetchProducts(page: number): Promise<ProductResponse['data']> {
  const url = `${API_BASE_URL}/products/search?page=${page}&size=20`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`상품 목록을 불러오지 못했어요 (HTTP ${res.status})`)
  }

  const body: ProductResponse = await res.json()
  return body.data
}
