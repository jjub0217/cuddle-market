export default function CommunityListSkeleton() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] pt-0 md:pt-5">
      <div className="mx-auto max-w-7xl px-0 md:px-4">
        <div className="flex flex-col gap-2.5 px-3.5 pt-4 md:px-0 md:pt-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-gray-400 bg-white px-3.5 py-4 shadow-xl">
              <div className="h-5 w-3/4 rounded bg-gray-200" />
              <div className="mt-2 flex items-center gap-2.5">
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-4 w-12 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
