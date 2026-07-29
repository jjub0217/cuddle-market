import type { ProductResponse } from '@cuddle/shared';

import { apiFetch } from './auth/api';
import type { TradeStatus } from './product-actions';

// 마이페이지에서 들어가는 목록 3종의 데이터 소스.
//
// 셋 다 로그인해야 볼 수 있어서 apiFetch로 보낸다(토큰 부착 + 401 갱신).
// 서버가 주는 봉투와 항목 모양이 홈 검색과 완전히 같아서(설계 §4) 타입을 새로 만들지 않고
// ProductResponse를 그대로 쓴다.

/** 목록 한 페이지. 무한스크롤에 content와 hasNext 둘 다 필요하다. */
export type MyListPage = ProductResponse['data'];

const PAGE_SIZE = 20; // 서버 기본값(@PageableDefault)과 같은 값

/**
 * 목록 셋의 다른 점은 주소와 오류 문구뿐이라 한 함수로 모은다.
 * @param label 오류 문구에 넣을 목록 이름. "찜한 상품을 불러오지 못했어요"처럼 쓰인다.
 * @param tradeStatus 있으면 그 상태만. 없으면 전체 — 서버가 파라미터 없으면 전부 준다.
 */
async function fetchMyList(
  path: string,
  page: number,
  label: string,
  tradeStatus?: TradeStatus
): Promise<MyListPage> {
  const query = `?page=${page}&size=${PAGE_SIZE}${tradeStatus ? `&tradeStatus=${tradeStatus}` : ''}`;
  const res = await apiFetch(`${path}${query}`);

  if (!res.ok) {
    throw new Error(`${label}을 불러오지 못했어요 (HTTP ${res.status})`);
  }

  const body: ProductResponse = await res.json();
  return body.data;
}

/** 찜한 상품. 상태 필터가 없는 목록이라 파라미터를 받지 않는다. */
export function fetchMyFavorites(page: number): Promise<MyListPage> {
  return fetchMyList('/profile/me/favorites', page, '찜한 상품');
}

export function fetchMyProducts(page: number, tradeStatus?: TradeStatus): Promise<MyListPage> {
  return fetchMyList('/profile/me/products', page, '판매 내역', tradeStatus);
}

export function fetchMyPurchases(page: number, tradeStatus?: TradeStatus): Promise<MyListPage> {
  return fetchMyList('/profile/me/purchase-requests', page, '구매 내역', tradeStatus);
}
