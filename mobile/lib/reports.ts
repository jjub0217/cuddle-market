import { apiFetch } from './auth/api';

// 신고와 차단을 한 곳에 모은다.
// 상품 상세 · 프로필 · 차단 목록 세 화면이 같은 재료를 쓰므로 흩어지면 어긋난다.
//
// 웹은 상품 신고를 REST + FormData로, 사용자 신고를 GraphQL로 보내 경로가 갈려 있고
// 그중 상품 쪽이 500으로 깨져 있다(#808). 앱은 둘 다 REST + JSON으로 보낸다 —
// 서버가 @RequestBody를 받으므로 그게 맞다.

/**
 * 서버가 준 상태 코드를 잃지 않으려고 따로 둔다.
 *
 * 보통 `Error`로 바꿔 던지면 문구만 남고 상태 코드가 사라진다. 그런데 「이미 신고했다」는
 * 문구로 가려낼 수 없어서(아래 isAlreadyReported 참고) 상태 코드를 여기 실어 보낸다.
 */
export class ReportError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ReportError';
  }
}

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
    // 서버 문구를 그대로 살리되, 상태 코드도 함께 실어 보낸다.
    // 중복 신고(409) 판별은 문구가 아니라 상태 코드로 한다 — isAlreadyReported 참고.
    const message = await readMessage(res);
    throw new ReportError(message ?? `${label}에 실패했어요 (HTTP ${res.status})`, res.status);
  }
}

/** 오류 응답의 message를 꺼낸다. 못 읽으면 null. (lib/community.ts와 같은 방식) */
export async function readMessage(res: Response): Promise<string | null> {
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
  if (!res.ok) throw new ReportError(`사용자 차단에 실패했어요 (HTTP ${res.status})`, res.status);
}

export async function unblockUser(userId: number): Promise<void> {
  const res = await apiFetch(`/reports/blocks/users/${userId}`, { method: 'DELETE' });
  if (!res.ok) throw new ReportError(`차단 해제에 실패했어요 (HTTP ${res.status})`, res.status);
}

export interface BlockedUser {
  /**
   * ⚠️ `userId`가 아니라 `blockedUserId`다(서버 BlockedUserResponse).
   * 다른 API들이 userId를 쓰다 보니 헷갈리기 쉬운데, 여기만 이름이 다르다.
   */
  blockedUserId: number;
  nickname: string;
  profileImageUrl: string | null;
}

interface BlockedPage {
  content: BlockedUser[];
  hasNext: boolean;
}

const PAGE_SIZE = 20; // 서버 기본값(@PageableDefault)과 같은 값

/**
 * 차단한 사람 목록.
 *
 * ⚠️ 응답이 한 겹 더 감싸져 있다. 다른 목록 API와 모양이 다르다.
 *
 *   { data: { blockedUsers: { content, hasNext, ... } } }
 *              ↑ 이 껍데기(BlockedUserListResponse.blockedUsers)를 빠뜨리면
 *                항상 빈 목록이 된다 — 실기기에서 실제로 그랬다.
 */
export async function fetchBlockedUsers(page: number): Promise<BlockedPage> {
  const res = await apiFetch(`/reports/blocks/users?page=${page}&size=${PAGE_SIZE}`);
  if (!res.ok) throw new Error(`차단 목록을 불러오지 못했어요 (HTTP ${res.status})`);

  const body = (await res.json()) as { data?: { blockedUsers?: Partial<BlockedPage> } };
  const page_ = body.data?.blockedUsers;

  return {
    content: page_?.content ?? [],
    hasNext: page_?.hasNext ?? false,
  };
}

/** ErrorCode.ALREADY_REPORTED(409) */
const ALREADY_REPORTED_STATUS = 409;

/**
 * 「이미 신고했다」인지 가려낸다.
 *
 * 문구로 가려내면 안 된다 — 서버는 대상 이름을 담아 던지지만
 * GlobalExceptionHandler가 그 문구를 버리고 ErrorCode의 한 줄만 준다.
 *
 *   ReportServiceImpl        "이미 신고된 " + targetName + "입니다."
 *   GlobalExceptionHandler   new ErrorResponse(e.getErrorCode(), traceId)   ← 위 문구를 버린다
 *   실제 응답                 409 { "message": "이미 신고된 대상입니다." }
 *
 * 9바퀴에는 '이미 신고한'을 찾고 있어서 한 번도 안 맞았다 (#817).
 * 웹도 같은 문제를 #808에서 409 기준으로 고쳤다(src/lib/api/reportErrors.ts).
 */
export function isAlreadyReported(error: unknown): boolean {
  return error instanceof ReportError && error.status === ALREADY_REPORTED_STATUS;
}
