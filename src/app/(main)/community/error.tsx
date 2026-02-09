'use client'

import { useEffect } from 'react'

export default function CommunityError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6]">
      <div className="flex flex-col items-center gap-4">
        <p className="text-lg font-semibold">커뮤니티를 불러올 수 없습니다</p>
        <p className="text-gray-500">잠시 후 다시 시도해주세요.</p>
        <button onClick={reset} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          다시 시도
        </button>
      </div>
    </div>
  )
}
