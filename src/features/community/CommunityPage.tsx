'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { COMMUNITY_SEARCH_TYPE, COMMUNITY_SORT_TYPE, COMMUNITY_TABS, type CommunityTabId } from '@/constants/constants'
import { CommunityTabs } from './components/CommunityTabs'
import { SearchBar } from '@/components/header/components/SearchBar'
import { SelectDropdown } from '@/components/commons/select/SelectDropdown'
import { ROUTES } from '@/constants/routes'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchInfoCommunity, fetchQuestionCommunity } from '@/lib/api/community'
import { UserRound, Clock, MessageSquare, Eye, Dot, Plus, MessageSquareText } from 'lucide-react'
import { LoadMoreButton } from '@/components/commons/button/LoadMoreButton'
import { getTimeAgo } from '@/lib/utils/getTimeAgo'
import { useUserStore } from '@/store/userStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useScrollDirection } from '@/hooks/useScrollDirection'
import { Button } from '@/components/commons/button/Button'
import { cn } from '@/lib/utils/cn'
import { Z_INDEX } from '@/constants/ui'
import { EmptyState } from '@/components/EmptyState'

export default function CommunityPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') as CommunityTabId | null
  // URL 파라미터에서 직접 계산 (상태 불필요)
  const activeCommunityTypeTab: CommunityTabId = tabParam === 'tab-info' ? 'tab-info' : 'tab-question'
  const isMd = useMediaQuery('(min-width: 768px)')
  const { isCollapsed: isFilterCollapsed } = useScrollDirection()

  const sortBy = searchParams.get('sortBy')
  const [selectedSort, setSelectedSort] = useState<string>(() => {
    const sortItem = COMMUNITY_SEARCH_TYPE.find((sort) => {
      return sort.id === sortBy
    })

    return sortItem?.label || '최신순'
  })
  const [selectSearchType, setSelectedSearchType] = useState<string>('제목')
  const searchType = COMMUNITY_SEARCH_TYPE.find((type) => type.label === selectSearchType)?.id || 'title'
  const currentKeyword = searchParams.get('communityKeyword') || ''
  const handleTabChange = (tabId: string) => {
    router.replace(`?tab=${tabId}`)
    // 탭 이동 시 정렬 및 검색 조건 초기화
    setSelectedSort('최신순')
    setSelectedSearchType('제목')
  }

  const handleSortChange = (value: string) => {
    const sortItem = COMMUNITY_SORT_TYPE.find((sort) => sort.label === value)

    if (!sortItem) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('sortBy', sortItem.id)
    router.push(`?${params.toString()}`)
    setSelectedSort?.(sortItem.label)
  }

  const handleSearchTypeChange = (value: string) => {
    const searchTypeItem = COMMUNITY_SEARCH_TYPE.find((type) => type.label === value)
    if (!searchTypeItem) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('searchType', searchTypeItem.id)
    params.delete('communityKeyword')
    router.push(`?${params.toString()}`)
    setSelectedSearchType(searchTypeItem.label)
  }

  // 질문 게시판
  const {
    data: questionData,
    fetchNextPage: fetchNextQuestion,
    hasNextPage: hasNextQuestion,
    isFetchingNextPage: isFetchingNextQuestion,
    isLoading: isLoadingQuestion,
    error: errorQuestion,
  } = useInfiniteQuery({
    queryKey: ['community', 'question', searchType, currentKeyword, sortBy],
    queryFn: ({ pageParam }) => fetchQuestionCommunity(pageParam, 10, searchType, currentKeyword, sortBy),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: activeCommunityTypeTab === 'tab-question',
  })

  // 정보 공유 게시판
  const {
    data: infoData,
    fetchNextPage: fetchNextInfo,
    hasNextPage: hasNextInfo,
    isFetchingNextPage: isFetchingNextInfo,
    isLoading: isLoadingInfo,
    error: errorInfo,
  } = useInfiniteQuery({
    queryKey: ['community', 'info', searchType, currentKeyword, sortBy],
    queryFn: ({ pageParam }) => fetchInfoCommunity(pageParam, 10, searchType, currentKeyword, sortBy),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: activeCommunityTypeTab === 'tab-info',
  })

  // 현재 탭에 맞는 로딩/에러 상태 선택
  const currentData = activeCommunityTypeTab === 'tab-question' ? questionData : infoData

  const isLoading = activeCommunityTypeTab === 'tab-question' ? isLoadingQuestion : isLoadingInfo

  const error = activeCommunityTypeTab === 'tab-question' ? errorQuestion : errorInfo

  // 현재 탭에 맞는 데이터 선택
  const communityPosts = (() => {
    switch (activeCommunityTypeTab) {
      case 'tab-question':
        return questionData?.pages.flatMap((page) => page.content) ?? []
      case 'tab-info':
        return infoData?.pages.flatMap((page) => page.content) ?? []
      default:
        return []
    }
  })()

  // 현재 탭에 맞는 페이지네이션 함수/상태
  const fetchNextPage = activeCommunityTypeTab === 'tab-question' ? fetchNextQuestion : fetchNextInfo

  const hasNextPage = activeCommunityTypeTab === 'tab-question' ? hasNextQuestion : hasNextInfo

  const isFetchingNextPage = activeCommunityTypeTab === 'tab-question' ? isFetchingNextQuestion : isFetchingNextInfo

  // const { title: headerTitle, description: headerDescription } = getHeaderContent()
  const { isLogin } = useUserStore()

  // 페이지 진입 시 스크롤 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (isLoading && !currentData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !currentData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p>게시글을 불러올 수 없습니다</p>
          <button onClick={() => window.location.reload()} className="text-blue-600 hover:text-blue-800">
            새로고침
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#F3F4F6] pt-0 md:pt-5">
      <div className="pb-4xl mx-auto max-w-7xl px-0 md:px-4">
        <div className="flex w-full flex-col">
          {/* 모바일: 필터 영역 */}
          {!isMd && (
            <div className={cn(!isFilterCollapsed && `sticky top-16 ${Z_INDEX.DROPDOWN}`)}>
              {/* 접히는 필터 영역 */}
              <div
                className={cn(
                  'bg-white transition-all duration-300 ease-out',
                  isFilterCollapsed ? 'max-h-0 overflow-hidden' : 'max-h-75 overflow-visible'
                )}
              >
                <div className="flex items-center justify-between border-b border-gray-200 p-3.5">
                  <CommunityTabs tabs={COMMUNITY_TABS} activeTab={activeCommunityTypeTab} onTabChange={handleTabChange} ariaLabel="커뮤니티 타입" />
                </div>

                <div className="flex flex-row-reverse items-center justify-between gap-3 border-b border-gray-200 px-3.5 pt-4 pb-3.5">
                  <div className="h-11 w-24">
                    <SelectDropdown
                      value={selectSearchType}
                      onChange={handleSearchTypeChange}
                      options={COMMUNITY_SEARCH_TYPE.map((sort) => ({
                        value: sort.label,
                        label: sort.label,
                      }))}
                      buttonClassName="border border-gray-300 bg-primary-50 text-gray-900 text-base px-3 py-2"
                    />
                  </div>
                  <SearchBar placeholder="게시글 검색" borderColor="border-gray-300" className="h-11 max-w-full" paramName="communityKeyword" />
                </div>
                <div className="flex gap-2 border-b border-gray-200 bg-white px-3.5 py-3.5">
                  {COMMUNITY_SORT_TYPE.map((sortType) => (
                    <Button
                      key={sortType.id}
                      type="button"
                      size="sm"
                      onClick={() => handleSortChange(sortType.label)}
                      className={cn(
                        'cursor-pointer rounded-full whitespace-nowrap',
                        selectedSort === sortType.label ? 'bg-primary-500 font-bold text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {sortType.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 데스크탑 */}
          {isMd && (
            <div className="mb-7 flex w-full flex-col gap-4">
              <div className="flex items-center justify-between">
                <CommunityTabs tabs={COMMUNITY_TABS} activeTab={activeCommunityTypeTab} onTabChange={handleTabChange} ariaLabel="커뮤니티 타입" />
                {isLogin() && (
                  <Link href={`${ROUTES.COMMUNITY_POST}?tab=${activeCommunityTypeTab}`} className="bg-primary-300 rounded-lg px-3 py-2 text-white">
                    글쓰기
                  </Link>
                )}
              </div>

              <div className="flex flex-row items-center justify-between gap-5">
                <div className="h-auto w-36">
                  <SelectDropdown
                    value={selectSearchType}
                    onChange={handleSearchTypeChange}
                    options={COMMUNITY_SEARCH_TYPE.map((sort) => ({
                      value: sort.label,
                      label: sort.label,
                    }))}
                    buttonClassName="border border-gray-300 bg-primary-50 text-gray-900 text-base px-3 py-2 "
                  />
                </div>
                <SearchBar
                  placeholder="게시글 제목이나 내용, 작성자로 검색해보세요"
                  borderColor="border-gray-300"
                  className="h-11 max-w-full"
                  paramName="communityKeyword"
                />
                <div className="w-36">
                  <SelectDropdown
                    value={selectedSort}
                    onChange={handleSortChange}
                    options={COMMUNITY_SORT_TYPE.map((category) => ({
                      value: category.label,
                      label: category.label,
                    }))}
                    buttonClassName="border border-gray-300 bg-primary-50 text-gray-900 text-base px-3 py-2"
                  />
                </div>
              </div>
            </div>
          )}
          {communityPosts.length === 0 ? (
            <div className={cn('px-3.5 md:px-0', !isMd && (isFilterCollapsed ? 'mt-20' : 'mt-4'))}>
              <EmptyState icon={MessageSquareText} title="아직 게시글이 없어요" description="첫 번째 이야기를 나눠보세요!" />
            </div>
          ) : (
            <ul className={cn('flex flex-col gap-2.5 px-3.5 md:p-0', !isMd && (isFilterCollapsed ? 'mt-20' : 'mt-4'))}>
              {communityPosts.map((post) =>
                isMd ? (
                  <li
                    key={post.id}
                    className="flex flex-col justify-center gap-2.5 rounded-lg border border-gray-400 bg-white px-3.5 pt-3.5 pb-3.5 shadow-xl"
                  >
                    <Link href={ROUTES.COMMUNITY_DETAIL_ID(post.id)} className="flex flex-col gap-1">
                      <p className="font-semibold">{post.title}</p>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1 text-gray-500">
                          <UserRound size={16} className="text-gray-500" strokeWidth={2.3} />
                          <p>{post.authorNickname}</p>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock size={16} className="text-gray-500" strokeWidth={2.3} />
                          <p>{getTimeAgo(post.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <MessageSquare size={16} className="text-gray-500" strokeWidth={2.3} />
                          <p>{post.commentCount}</p>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Eye size={16} className="text-gray-500" strokeWidth={2.3} />
                          <span>조회</span>
                          <span>{post.viewCount}</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ) : (
                  <li
                    key={post.id}
                    className="flex flex-col justify-center gap-2.5 rounded-lg border border-gray-400 bg-white px-3.5 pt-3.5 pb-5 shadow-xl"
                  >
                    <Link href={ROUTES.COMMUNITY_DETAIL_ID(post.id)} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <p className="text-lg font-semibold">{post.title}</p>

                        <p className="line-clamp-1">{post.contentPreview}</p>
                      </div>
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center text-gray-500">
                          <p>{post.authorNickname}</p>
                          <Dot size={12} />
                          <p>{getTimeAgo(post.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-1 text-gray-500">
                            <MessageSquare size={16} className="text-gray-500" strokeWidth={2.3} />
                            <p>{post.commentCount}</p>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Eye size={16} className="text-gray-500" strokeWidth={2.3} />
                            <span>{post.viewCount}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              )}
            </ul>
          )}
          {hasNextPage &&
            (isMd ? (
              <LoadMoreButton onClick={() => fetchNextPage()} isLoading={isFetchingNextPage} classname="border-0" />
            ) : (
              <div className="px-3.5">
                <LoadMoreButton onClick={() => fetchNextPage()} isLoading={isFetchingNextPage} classname="border-0" />
              </div>
            ))}
        </div>
      </div>
      {!isMd && isLogin() && (
        <Link
          href={`${ROUTES.COMMUNITY_POST}?tab=${activeCommunityTypeTab}`}
          className={`bg-primary-200 fixed right-4 bottom-4 rounded-full px-3 py-3 text-white ${Z_INDEX.FLOATING_BUTTON}`}
        >
          <Plus />
        </Link>
      )}
    </div>
  )
}
