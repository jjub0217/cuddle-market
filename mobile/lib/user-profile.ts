import type { ProductResponse } from '@cuddle/shared';

import { apiFetch } from './auth/api';
import type { MyListPage } from './my-lists';

// 남의 프로필 화면이 쓰는 조회 셋.
//
// 셋 다 로그인해야 볼 수 있다 — 서버에 @PreAuthorize("isAuthenticated()")가 걸려 있어
// 게스트가 부르면 401이 온다. 그래서 화면이 게스트를 미리 걸러야 한다(Task 8).

/**
 * 서버는 이보다 많은 필드를 주지만 화면이 쓰는 것만 적는다.
 * (내 프로필은 lib/profile.ts의 MyProfile이 따로 있다 — 쓰는 필드가 다르다.)
 */
export interface UserProfile {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  addressSido: string | null;
  addressGugun: string | null;
  /** 소개글. 없으면 화면이 「소개글이 없습니다」를 대신 그린다 */
  introduction: string | null;
  /** 내가 이 사람을 이미 차단했는지 */
  isBlocked: boolean;
  /** 내가 이 사람을 이미 신고했는지 */
  isReported: boolean;
}

export async function fetchUserProfile(userId: number): Promise<UserProfile> {
  const res = await apiFetch(`/profile/${userId}`);
  if (!res.ok) throw new Error(`프로필을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data: Partial<UserProfile> & { id: number } };
  const data = body.data;

  return {
    id: data.id,
    nickname: data.nickname ?? '',
    profileImageUrl: data.profileImageUrl ?? null,
    addressSido: data.addressSido ?? null,
    addressGugun: data.addressGugun ?? null,
    introduction: data.introduction ?? null,
    // 서버가 안 주면 "아직 아니다"로 본다 — 화면이 「차단 해제」를 잘못 그리는 것보다 낫다.
    isBlocked: data.isBlocked ?? false,
    isReported: data.isReported ?? false,
  };
}

/**
 * 상품 종류. 서버가 주소를 아예 나눠 놨다.
 *   sell     GET /profile/{id}/products            판매 상품(SELL)만
 *   request  GET /profile/{id}/purchase-requests    판매 요청(REQUEST)만
 * 「전체」 주소는 없다 — 그래서 화면 탭도 둘뿐이다(설계 §5).
 */
export type ProductKind = 'sell' | 'request';

const PAGE_SIZE = 20; // 서버 기본값(@PageableDefault)과 같은 값

export async function fetchUserProducts(
  userId: number,
  kind: ProductKind,
  page: number
): Promise<MyListPage> {
  const path = kind === 'sell' ? 'products' : 'purchase-requests';
  const label = kind === 'sell' ? '판매 상품' : '판매 요청';

  const res = await apiFetch(`/profile/${userId}/${path}?page=${page}&size=${PAGE_SIZE}`);
  if (!res.ok) throw new Error(`${label}을 불러오지 못했어요 (HTTP ${res.status})`);

  const body: ProductResponse = await res.json();
  return body.data;
}
