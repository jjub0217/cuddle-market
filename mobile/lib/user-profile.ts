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
  /**
   * 가입한 때. 서버가 이미 준다(`UserProfileResponse.java:26`).
   *
   * 중고거래에서 **신뢰 신호**라 남의 프로필에 그린다 — 「3년 된 사람」과 「어제 가입한
   * 사람」은 거래를 결정할 때 다르게 읽힌다. 시각까지 오지만 화면에는 날짜만 그린다.
   */
  createdAt: string | null;
  /** 내가 이 사람을 이미 차단했는지 */
  isBlocked: boolean;
  /** 내가 이 사람을 이미 신고했는지 */
  isReported: boolean;
}

/**
 * 없는 사용자(404). 화면에서 「탈퇴한 사용자예요」 안내를 띄우려고 따로 구분한다.
 *
 * **서버가 탈퇴한 사람을 일부러 걸러 404를 준다**(`ProfileServiceImpl.java:117` —
 * `findById(...).filter(u -> !u.isDeleted())`). 그래서 이 404는 네트워크 탈이 아니라
 * **다시 눌러도 영영 같은 결과**다. 안 가르면 「네트워크를 확인하고 다시 시도해 주세요」가
 * 떠서, 일시적인 탈인 줄 알고 계속 누르게 된다.
 *
 * 상품 상세의 `ProductNotFoundError`(lib/products.ts)와 같은 모양이다.
 */
export class UserNotFoundError extends Error {
  constructor() {
    super('사용자를 찾을 수 없습니다.');
    this.name = 'UserNotFoundError';
  }
}

export async function fetchUserProfile(userId: number): Promise<UserProfile> {
  const res = await apiFetch(`/profile/${userId}`);
  // ⚠️ 401(로그인 필요)은 여기 안 걸린다 — apiFetch 가 갱신을 한 번 해 보고 그래도
  //    401이면 그대로 돌려주므로, 아래 `!res.ok` 로 빠져 지금과 같은 오류가 된다.
  //
  // ⚠️ **서버가 404를 주게 된 것은 2026-08-21 부터다**(백엔드 a9da398, #995). 그전에는
  //    없는 사용자에게도 401(ErrorCode.USER_NOT_FOUND 의 값이 401이었다)이 나가서 앱이
  //    「로그인이 풀렸다」와 구분하지 못했다. **배포되지 않은 서버를 보면 이 분기가 안 걸린다.**
  if (res.status === 404) throw new UserNotFoundError();
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
    createdAt: data.createdAt ?? null,
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
