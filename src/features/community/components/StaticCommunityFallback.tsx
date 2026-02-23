import Link from 'next/link'
import type { CommunityItem } from '@/types'
import { getTimeAgo } from '@/lib/utils/getTimeAgo'
import { ROUTES } from '@/constants/routes'

/**
 * Suspense fallback용 서버 컴포넌트
 *
 * CommunityPage가 useSearchParams()로 인해 Suspense bailout되는 동안,
 * 초기 HTML에 실제 게시글 제목을 포함시켜 LCP를 개선한다.
 *
 * - 서버 컴포넌트이므로 초기 HTML에 직접 렌더링됨
 * - CommunityPage 모바일 카드와 동일한 레이아웃 구조를 유지하여 CLS 방지
 * - 필터/탭은 비인터랙티브 플레이스홀더로 렌더링
 * - lucide 아이콘은 클라이언트 번들 증가를 피하기 위해 생략
 * - Hydration 후 CommunityPage가 이 컴포넌트를 대체함
 */

interface StaticCommunityFallbackProps {
  posts: CommunityItem[]
}

export default function StaticCommunityFallback({ posts }: StaticCommunityFallbackProps) {
  return (
    <div className="relative min-h-screen bg-[#F3F4F6] pt-0">
      <div className="pb-4xl mx-auto max-w-7xl px-0">
        <div className="flex w-full flex-col">
          {/* 필터 영역 플레이스홀더 (탭 + 검색 + 정렬) */}
          <FilterPlaceholder />

          {/* 게시글 목록: 실제 데이터 렌더링 */}
          <ul className="mt-4 flex flex-col gap-2.5 px-3.5">
            {posts.map((post) => (
              <li
                key={post.id}
                className="flex flex-col justify-center gap-2.5 rounded-lg border border-gray-400 bg-white px-3.5 pt-3.5 pb-5 shadow-xl"
              >
                <Link href={ROUTES.COMMUNITY_DETAIL_ID(post.id, post.title)} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-lg font-semibold">{post.title}</p>
                    <p className="line-clamp-1">{post.contentPreview}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center text-gray-500">
                      <p>{post.authorNickname}</p>
                      <span className="mx-0.5">·</span>
                      <p>{getTimeAgo(post.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-gray-500">{post.commentCount}</span>
                      <span className="text-gray-500">{post.viewCount}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function FilterPlaceholder() {
  return (
    <>
      {/* 탭 영역 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-3.5">
        <div className="flex gap-2">
          <div className="h-9 w-20 animate-pulse rounded-full bg-gray-200" />
          <div className="h-9 w-20 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>
      {/* 검색 영역 */}
      <div className="flex flex-row-reverse items-center justify-between gap-3 border-b border-gray-200 bg-white px-3.5 pt-4 pb-3.5">
        <div className="h-11 w-24 animate-pulse rounded bg-gray-100" />
        <div className="h-11 flex-1 animate-pulse rounded bg-gray-100" />
      </div>
      {/* 정렬 영역 */}
      <div className="flex gap-2 border-b border-gray-200 bg-white px-3.5 py-3.5">
        {['최신순', '조회순', '댓글순'].map((label) => (
          <div key={label} className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
            {label}
          </div>
        ))}
      </div>
    </>
  )
}
