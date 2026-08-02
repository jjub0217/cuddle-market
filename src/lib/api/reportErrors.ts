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

// 게시글 신고는 axios가 아니라 /api/graphql을 지난다. 그 길에서는 AxiosError가
// 남지 않는다 — 오는 동안 세 번 갈아탄다.
//
//   서버        409 { "message": "이미 신고된 대상입니다." }
//   리졸버      throw new Error(`REST API error: ${res.status}`)   resolvers.ts fetchAPI
//   Apollo      그 문구를 그대로 errors[0].message에 담는다 (문구를 안 가린다)
//   fetchGraphQL  throw new Error(json.errors[0].message)          graphql.ts
//
// 그래서 GraphQL 쪽은 문구를 볼 수밖에 없다. 다만 이 문구는 서버가 아니라
// **우리 코드가 지은 것**이라(resolvers.ts) 서버가 말을 바꿔도 안 흔들린다.
// 예전에 서버 한국어 문구를 찾다가 한 번도 안 맞았던 것과는 다르다.
const GRAPHQL_ALREADY_REPORTED_MESSAGE = `REST API error: ${ALREADY_REPORTED_STATUS}`

export function isAlreadyReported(error: unknown): boolean {
  if (isAxiosError(error)) return error.response?.status === ALREADY_REPORTED_STATUS
  return error instanceof Error && error.message.includes(GRAPHQL_ALREADY_REPORTED_MESSAGE)
}
