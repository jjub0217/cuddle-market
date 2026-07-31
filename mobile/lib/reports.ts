import { apiFetch } from './auth/api';

// 신고와 차단을 한 곳에 모은다.
// 상품 상세 · 프로필 · 차단 목록 세 화면이 같은 재료를 쓰므로 흩어지면 어긋난다.
//
// 웹은 상품 신고를 REST + FormData로, 사용자 신고를 GraphQL로 보내 경로가 갈려 있고
// 그중 상품 쪽이 500으로 깨져 있다(#808). 앱은 둘 다 REST + JSON으로 보낸다 —
// 서버가 @RequestBody를 받으므로 그게 맞다.

/**
 * ⚠️ 두 신고 API의 필드 이름이 다르다. 여기서 틀리면 조용히 실패한다.
 *
 *   상품    { reasonCodes: ["ILLEGAL_ITEM"] }   ProductReportRequest.reasonCodes: List<String>
 *   사용자  { reasonCode:  "HARASSMENT"    }   UserReportRequest.reasonCode: String
 *
 * 화면은 어느 쪽이든 사유를 하나만 고르게 한다(웹도 라디오다).
 * 상품 쪽만 보낼 때 배열로 감싼다.
 */
async function postReport(path: string, payload: Record<string, unknown>, label: string) {
  const res = await apiFetch(path, { method: 'POST', body: JSON.stringify(payload) });

  if (!res.ok) {
    // 서버 문구를 그대로 살린다 — "이미 신고한 상품입니다" 같은 것을 화면이 구별해야 한다.
    const message = await readMessage(res);
    throw new Error(message ?? `${label}에 실패했어요 (HTTP ${res.status})`);
  }
}

/** 오류 응답의 message를 꺼낸다. 못 읽으면 null. */
async function readMessage(res: Response): Promise<string | null> {
  try {
    const body = (await res.json()) as { message?: string };
    return body?.message ?? null;
  } catch {
    return null;
  }
}

/** 빈 문자열·공백만 있는 상세 사유는 아예 안 보낸다(서버에서 선택 필드다). */
function trimmed(detailReason?: string): string | undefined {
  const value = detailReason?.trim();
  return value ? value : undefined;
}

export function reportProduct(
  productId: number,
  reasonCode: string,
  detailReason?: string
): Promise<void> {
  const detail = trimmed(detailReason);
  return postReport(
    `/reports/products/${productId}`,
    { reasonCodes: [reasonCode], ...(detail ? { detailReason: detail } : {}) },
    '상품 신고'
  );
}

export function reportUser(
  userId: number,
  reasonCode: string,
  detailReason?: string
): Promise<void> {
  const detail = trimmed(detailReason);
  return postReport(
    `/reports/users/${userId}`,
    { reasonCode, ...(detail ? { detailReason: detail } : {}) },
    '사용자 신고'
  );
}

export async function blockUser(userId: number): Promise<void> {
  const res = await apiFetch(`/reports/blocks/users/${userId}`, { method: 'POST' });
  if (!res.ok) throw new Error(`사용자 차단에 실패했어요 (HTTP ${res.status})`);
}

export async function unblockUser(userId: number): Promise<void> {
  const res = await apiFetch(`/reports/blocks/users/${userId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`차단 해제에 실패했어요 (HTTP ${res.status})`);
}

export interface BlockedUser {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
}

interface BlockedPage {
  content: BlockedUser[];
  hasNext: boolean;
}

const PAGE_SIZE = 20; // 서버 기본값(@PageableDefault)과 같은 값

export async function fetchBlockedUsers(page: number): Promise<BlockedPage> {
  const res = await apiFetch(`/reports/blocks/users?page=${page}&size=${PAGE_SIZE}`);
  if (!res.ok) throw new Error(`차단 목록을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data?: Partial<BlockedPage> };
  return {
    content: body.data?.content ?? [],
    hasNext: body.data?.hasNext ?? false,
  };
}

/**
 * 「이미 신고했다」인지 가려낸다.
 *
 * 웹도 문구로 가려낸다(ProductReportModal · UserReportModal). 서버가 따로 코드를
 * 주지 않아서다. 상품은 "이미 신고한 상품입니다", 사용자는 "이미 신고한 사용자입니다".
 */
export function isAlreadyReported(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return message.includes('이미 신고한');
}
