'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { COMMUNITY_SORT_TYPE, COMMUNITY_TABS, type CommunityTabId } from '@/constants/constants'
import { UnderlineTabs } from '@/components/UnderlineTabs'
import { ROUTES } from '@/constants/routes'
import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/api'
import { Eye, MessageSquare, MessageSquareText, PenLine, Plus, Search } from 'lucide-react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { getTimeAgo } from '@/lib/utils/getTimeAgo'
import { useUserStore } from '@/store/userStore'
import { cn } from '@/lib/utils/cn'
import { Z_INDEX } from '@/constants/ui'
import EmptyState from '@/components/EmptyState'
import Spinner from '@/components/commons/spinner/Spinner'
import type { CommunityItem } from '@/types'
import { CommunityPostThumbnail } from './components/CommunityPostThumbnail'

interface CommunityListData {
  page: number
  size: number
  total: number
  content: CommunityItem[]
  hasNext: boolean
  hasPrevious: boolean
  totalElements: number
  numberOfElements: number
}

interface CommunityPageProps {
  initialQuestionData?: CommunityListData | null
  initialInfoData?: CommunityListData | null
}

const SEARCH_TYPE = 'title_content'

export default function CommunityPage({ initialQuestionData, initialInfoData }: CommunityPageProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') as CommunityTabId | null
  const activeCommunityTypeTab: CommunityTabId = tabParam === 'tab-info' ? 'tab-info' : 'tab-question'

  const sortBy = searchParams.get('sortBy') ?? 'latest'
  const currentKeyword = searchParams.get('communityKeyword') || ''

  const [searchInput, setSearchInput] = useState(currentKeyword)

  useEffect(() => {
    setSearchInput(currentKeyword)
  }, [currentKeyword])

  const handleTabChange = (tabId: string) => {
    router.replace(`?tab=${tabId}`)
  }

  const handleSortChange = (sortId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sortBy', sortId)
    router.push(`?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter') {
      const params = new URLSearchParams(searchParams.toString())
      const keyword = e.currentTarget.value.trim()
      if (keyword) {
        params.set('communityKeyword', keyword)
      } else {
        params.delete('communityKeyword')
      }
      router.push(`?${params.toString()}`)
    }
  }

  const {
    data: questionData,
    fetchNextPage: fetchNextQuestion,
    hasNextPage: hasNextQuestion,
    isFetchingNextPage: isFetchingNextQuestion,
    isLoading: isLoadingQuestion,
    error: errorQuestion,
  } = useInfiniteQuery({
    queryKey: ['community', 'question', SEARCH_TYPE, currentKeyword, sortBy],
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/community/posts', {
        params: {
          page: pageParam,
          size: 10,
          boardType: 'QUESTION',
          searchType: SEARCH_TYPE,
          keyword: currentKeyword || undefined,
          sortBy,
        },
      })
      return response.data.data
    },
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    initialData: initialQuestionData ? { pages: [initialQuestionData], pageParams: [0] } : undefined,
    enabled: activeCommunityTypeTab === 'tab-question',
  })

  const {
    data: infoData,
    fetchNextPage: fetchNextInfo,
    hasNextPage: hasNextInfo,
    isFetchingNextPage: isFetchingNextInfo,
    isLoading: isLoadingInfo,
    error: errorInfo,
  } = useInfiniteQuery({
    queryKey: ['community', 'info', SEARCH_TYPE, currentKeyword, sortBy],
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/community/posts', {
        params: {
          page: pageParam,
          size: 10,
          boardType: 'INFO',
          searchType: SEARCH_TYPE,
          keyword: currentKeyword || undefined,
          sortBy,
        },
      })
      return response.data.data
    },
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    initialData: initialInfoData ? { pages: [initialInfoData], pageParams: [0] } : undefined,
    enabled: activeCommunityTypeTab === 'tab-info',
  })

  const currentData = activeCommunityTypeTab === 'tab-question' ? questionData : infoData
  const isLoading = activeCommunityTypeTab === 'tab-question' ? isLoadingQuestion : isLoadingInfo
  const error = activeCommunityTypeTab === 'tab-question' ? errorQuestion : errorInfo
  const fetchNextPage = activeCommunityTypeTab === 'tab-question' ? fetchNextQuestion : fetchNextInfo
  const hasNextPage = activeCommunityTypeTab === 'tab-question' ? hasNextQuestion : hasNextInfo
  const isFetchingNextPage = activeCommunityTypeTab === 'tab-question' ? isFetchingNextQuestion : isFetchingNextInfo

  const communityPosts: CommunityItem[] = (() => {
    switch (activeCommunityTypeTab) {
      case 'tab-question':
        return questionData?.pages.flatMap((page) => page.content) ?? []
      case 'tab-info':
        return infoData?.pages.flatMap((page) => page.content) ?? []
      default:
        return []
    }
  })()

  const { isLogin } = useUserStore()
  const hasHydrated = useUserStore((state) => state._hasHydrated)

  // 무한스크롤 sentinel
  const sentinelRef = useIntersectionObserver({
    enabled: !!hasNextPage,
    hasNextPage,
    isFetchingNextPage,
    onIntersect: () => fetchNextPage(),
    threshold: 0.1,
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (isLoading && !currentData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="md" />
      </div>
    )
  }

  if (error || !currentData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-on-surface-muted">게시글을 불러올 수 없습니다</p>
          <button onClick={() => window.location.reload()} className="text-primary hover:underline">
            새로고침
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <h1 className="sr-only">커뮤니티 페이지</h1>
      <main className="mx-auto w-full max-w-7xl px-4 py-5 md:py-8">
        {/* Header */}
        <section className="mb-4">
          {/* <h2 className="mb-6 text-lg font-bold tracking-tight text-primary">질문/정보</h2> */}
          <UnderlineTabs
            tabs={COMMUNITY_TABS}
            activeTab={activeCommunityTypeTab}
            onTabChange={handleTabChange}
            ariaLabel="커뮤니티 타입"
          />
        </section>

        {/* Search (단독 행) */}
        <section className="mb-6">
          <div className="relative w-full">
            <Search size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-[#827565]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchSubmit}
              placeholder="궁금한 내용을 검색해보세요"
              enterKeyHint="search"
              className="border-outline-variant/40 bg-surface-container-low focus:border-primary focus:ring-primary/20 w-full rounded-full border py-2 pr-4 pl-11 text-sm text-[#1c1b1b] placeholder:text-sm placeholder:text-[#827565] focus:ring-2 focus:outline-none"
            />
          </div>
        </section>

        {/* Sort filter + 글쓰기 (콘텐츠 컨트롤 행) */}
        <section className="mb-2 flex items-end justify-between gap-3 text-sm md:mb-4">
          <div className="flex items-center gap-3 max-md:ml-auto">
            {COMMUNITY_SORT_TYPE.map((sort, idx) => {
              const isActive = sort.id === sortBy
              return (
                <div key={sort.id} className="flex items-center gap-3">
                  {idx > 0 ? <span aria-hidden="true" className="bg-outline-variant/60 h-3 w-px" /> : null}
                  <button
                    type="button"
                    onClick={() => handleSortChange(sort.id)}
                    className={cn(
                      'cursor-pointer font-normal transition-colors',
                      isActive
                        ? 'text-primary font-semibold md:font-bold'
                        : 'text-on-surface-muted hover:text-primary md:font-medium'
                    )}
                  >
                    {sort.label}
                  </button>
                </div>
              )
            })}
          </div>
          {hasHydrated && isLogin() ? (
            <Link
              href={`${ROUTES.COMMUNITY_POST}?tab=${activeCommunityTypeTab}`}
              className="bg-primary hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-opacity hover:opacity-90 active:scale-95 md:flex"
            >
              <PenLine size={16} />
              <span>글쓰기</span>
            </Link>
          ) : null}
        </section>

        {/* Post list */}
        <section
          id={`panel-${COMMUNITY_TABS.find((tab) => tab.id === activeCommunityTypeTab)?.code}`}
          role="tabpanel"
          aria-labelledby={activeCommunityTypeTab}
        >
          {communityPosts.length === 0 ? (
            <EmptyState icon={MessageSquareText} title="아직 게시글이 없어요" description="첫 번째 이야기를 나눠보세요!" />
          ) : (
            <ul className="grid grid-cols-1 gap-2 md:gap-4">
              {communityPosts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={ROUTES.COMMUNITY_DETAIL_ID(post.id, post.title)}
                    className="group border-outline-variant/40 block rounded-2xl border bg-white p-3 shadow-sm transition-all hover:shadow-md md:p-4"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 md:items-stretch">
                      <div className="min-w-0 flex-1">
                        {/* Author + time */}
                        <div className="mb-3 flex items-end gap-2.5">
                          <div className="bg-chip-surface flex size-9 items-center justify-center rounded-full text-sm font-bold text-[#825500]">
                            {post.authorNickname.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col gap-0.5 leading-tight md:gap-0">
                            <span className="text-xs font-bold text-[#1c1b1b] md:text-sm">{post.authorNickname}</span>
                            <span className="text-xs text-[#827565]">{getTimeAgo(post.createdAt)}</span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="group-hover:text-primary mb-1 line-clamp-2 text-base leading-snug font-semibold text-[#1c1b1b] transition-colors md:mb-2 md:text-lg">
                          {post.title}
                        </h3>

                        {/* Preview */}
                        <p className="text-on-surface-muted line-clamp-2 text-sm leading-relaxed whitespace-pre-line">
                          {post.contentPreview}
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          {/* Meta */}
                          <div className="flex gap-1 text-[#827565]/60">
                            <Eye size={16} strokeWidth={2} />
                            <span className="text-xs font-bold text-[#827565]">{post.viewCount ?? 0}</span>
                          </div>
                          <div className="flex gap-1 text-[#827565]/60">
                            <MessageSquare size={16} strokeWidth={2} />
                            <span className="text-xs font-bold text-[#827565]">{post.commentCount}</span>
                          </div>
                        </div>
                      </div>
                      <CommunityPostThumbnail imageUrl={post.thumbnailImageUrl} title={post.title} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 무한스크롤 sentinel + 로딩 인디케이터 */}
        {hasNextPage ? (
          <div ref={sentinelRef} className="mt-8 flex justify-center" aria-hidden="true">
            {isFetchingNextPage ? <Spinner size="sm" /> : null}
          </div>
        ) : null}
      </main>

      {/* Mobile FAB */}
      {hasHydrated && isLogin() ? (
        <Link
          href={`${ROUTES.COMMUNITY_POST}?tab=${activeCommunityTypeTab}`}
          className={cn(
            'bg-primary fixed right-4 bottom-20 flex items-center gap-2 rounded-full px-4 py-3 text-white shadow-lg transition-all hover:brightness-110 active:scale-95 md:hidden',
            Z_INDEX.FLOATING_BUTTON
          )}
          aria-label="글쓰기"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span className="text-base font-bold">글쓰기</span>
        </Link>
      ) : null}
    </div>
  )
}
