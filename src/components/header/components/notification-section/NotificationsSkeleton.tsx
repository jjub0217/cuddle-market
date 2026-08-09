/**
 * 알림을 불러오는 동안 보이는 자리.
 *
 * ⚠️ **두 줄이다.** 다섯 줄이면 450px 인데, 알림이 하나도 없을 때 뜨는 화면은 128px 이라
 *    로딩이 끝나는 순간 화면이 322px 이나 줄며 덜컥 움직였다(#869 실측).
 *    두 줄(180px)이면 그 차이가 52px 로 줄어든다.
 *
 * 한 줄(90px)이 수치로는 가장 가깝지만 그러면 「목록이 올 자리」로 안 읽힌다 —
 * 스켈레톤은 무엇이 올지 알리는 것이라 최소한 여러 줄임은 보여야 한다.
 */
export default function NotificationsSkeleton() {
  return (
    <>
      {[...Array(2)].map((_, index) => (
        <div key={index} className="flex animate-pulse items-start gap-3 border-b border-gray-200 px-4 pt-4.25 pb-4">
          {/* 아이콘 자리 */}
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200" />

          {/* 콘텐츠 자리 */}
          <div className="flex min-w-64 gap-1">
            <div className="flex flex-1 flex-col gap-1">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="mt-1 h-3 w-16 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
