import { isAxiosError } from 'axios'

// 신고 오류를 읽는 법.
//
// 「이미 신고했다」를 문구로 가려내던 것을 상태 코드로 바꾼다.
//
// 왜 문구로는 안 되나 (2026-08-01, 서버를 직접 열어 확인):
// 서비스는 대상 이름을 담아 던진다.
//
//   throw new AlreadyReportedException("이미 신고된 " + targetName + "입니다.")   // 상품·유저·게시글
//
// 그런데 GlobalExceptionHandler가 그 문구를 **버린다.**
//
//   ErrorResponse errorResponse = new ErrorResponse(e.getErrorCode(), traceId)
//
// 그래서 화면에 실제로 오는 것은 ErrorCode에 박힌 한 줄뿐이다.
//
//   409  { "message": "이미 신고된 대상입니다." }
//
// 웹 상품 신고는 「이미 신고된 상품」을, 사용자 신고는 「이미 신고한 사용자입니다」를
// 찾고 있었다. 둘 다 안 맞아서 중복 신고인데도 「신고에 실패했습니다」가 떴다.
//
// 상태 코드는 서버가 문구를 바꿔도 안 흔들린다.

/** ErrorCode.ALREADY_REPORTED(409) */
const ALREADY_REPORTED_STATUS = 409

export function isAlreadyReported(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === ALREADY_REPORTED_STATUS
}

/** 서버가 준 문구. 못 읽으면 null */
export function readErrorMessage(error: unknown): string | null {
  if (!isAxiosError(error)) return null
  const message = (error.response?.data as { message?: string } | undefined)?.message
  return message ?? null
}
