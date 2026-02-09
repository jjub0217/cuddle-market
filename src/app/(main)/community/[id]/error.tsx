'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CommunityDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6]">
      <div className="flex flex-col items-center gap-4">
        <p className="text-lg font-semibold">게시글을 불러올 수 없습니다</p>
        <p className="text-gray-500">잠시 후 다시 시도해주세요.</p>
        <div className="flex gap-3">
          <button onClick={() => router.push('/community')} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
            목록으로 돌아가기
          </button>
          <button onClick={reset} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            다시 시도
          </button>
        </div>
      </div>
    </div>
  )
}
