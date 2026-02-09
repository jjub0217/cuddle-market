export default function CommunityDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] pt-5">
      <div className="mx-auto max-w-7xl px-3.5">
        <div className="animate-pulse rounded-lg border border-gray-400 bg-white px-6 py-5 shadow-xl">
          <div className="h-6 w-20 rounded-full bg-gray-200" />
          <div className="mt-4 flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="flex flex-col gap-1">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-3 w-32 rounded bg-gray-200" />
            </div>
          </div>
          <div className="mt-4 h-6 w-2/3 rounded bg-gray-200" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-3/4 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
