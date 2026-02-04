export default function NotificationsSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex animate-pulse items-start gap-3 border-b border-gray-200 px-4 pt-[17px] pb-4">
          {/* 아이콘 자리 */}
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200" />

          {/* 콘텐츠 자리 */}
          <div className="flex min-w-72 gap-1">
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
