// 장소(펫지도) 별점을 「보여줄지」 정하는 규칙. 웹·앱이 같은 답을 내게 한 곳에 모은다.
//
// ⚠️ 서버는 후기가 하나도 없어도 reviewSummary 를 null 로 주지 않는다.
//    { reviewCount: 0, averageRating: 0.0 } 을 채워 보낸다 — 운영 실측(2026-08-20)에서
//    서울 병원 100곳이 전부 이 모양이었다. 그래서 `reviewSummary &&` 로는 아무것도 못 거르고,
//    화면에 뜻 없는 「0.0」이 뜬다(#982). 이 규칙이 다섯 곳에 복사돼 있다가 서로 어긋났다.

/** 서버가 주는 후기 요약. 웹 src/types/map.ts · 앱 mobile/lib/places/types.ts 와 같은 모양 */
export interface PlaceReviewSummary {
  reviewCount: number
  averageRating: number
}

/**
 * 별점을 그릴지 정한다. **후기가 한 개라도 있을 때만** 참이다.
 *
 * 평균값이 아니라 개수로 보는 이유: 서버가 rating 을 1~5 로 강제하므로
 * (PlaceReviewCreateRequest 의 @Min(1) @Max(5)) 후기가 있으면 평균은 반드시 1.0 이상이다.
 * 개수로 묻는 쪽이 「후기가 있는가」라는 뜻에 그대로 맞는다.
 *
 * 타입 가드로 만든 이유: 이 함수를 통과한 뒤 화면에서 바로 `.averageRating` 을 읽는데,
 * boolean 을 돌려주면 타입스크립트가 「아직 null 일 수 있다」고 막는다.
 *
 * @param summary 서버가 준 reviewSummary
 */
export function hasPlaceRating<T extends PlaceReviewSummary>(
  summary: T | null | undefined
): summary is T {
  return summary != null && summary.reviewCount > 0
}
