'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  COMMUNITY_TABS,
  EVENT_SORT_TYPE,
  getCommunitySortTypes,
  normalizeSortBy,
  type CommunityTabId,
} from '@/constants/constants'
import { UnderlineTabs } from '@/components/UnderlineTabs'
import { ROUTES } from '@/constants/routes'
import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/api'
import { CalendarDays, Eye, MessageSquare, MessageSquareText, PenLine, Plus, Search, X } from 'lucide-react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import LoadMoreFocusButton from '@/components/commons/LoadMoreFocusButton'
import SkipToLoadMoreLink from '@/components/commons/SkipToLoadMoreLink'
import { getTimeAgo } from '@cuddle/shared'
import { useUserStore } from '@/store/userStore'
import { cn } from '@/lib/utils/cn'
import { PAGE_CONTAINER, Z_INDEX } from '@/constants/ui'
import EmptyState from '@/components/EmptyState'
import Spinner from '@/components/commons/spinner/Spinner'
import type { CommunityItem } from '@/types'
import { CommunityPostThumbnail } from './components/CommunityPostThumbnail'
import { EventPostCard } from './components/EventPostCard'
import {
  EVENT_STATUS_FILTERS,
  getEventEmptyTitle,
  toEventStatusParam,
  toKoreanDateString,
} from '@/lib/utils/eventStatus'
import SelectDropdown from '@/components/commons/select/SelectDropdown'

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
  initialEventData?: CommunityListData | null
}

const SEARCH_TYPE = 'title_content'

// 행사 소식의 상태·정렬 드롭다운 모양. 홈 상세 필터의 지역 드롭다운(LocationFilter card-chip)을 따랐지만
// 글자는 펼친 목록의 기본 크기(text-sm)에 맞춘다 — text-xs 로 두면 펼칠 때 글자가 커진다(홈은 그대로 둔다)
const EVENT_DROPDOWN_CLASS =
  'border border-outline-variant bg-white text-gray-900 px-4 py-2 text-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20'

export default function CommunityPage({ initialQuestionData, initialInfoData, initialEventData }: CommunityPageProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') as CommunityTabId | null
  const activeCommunityTypeTab: CommunityTabId =
    tabParam === 'tab-info' || tabParam === 'tab-event' ? tabParam : 'tab-question'
  const isEventTab = activeCommunityTypeTab === 'tab-event'
  // 행사 상태(D-n, 진행 중, 종료)를 가르는 날. 서버 조각(StaticCommunityFallback)과 같은 함수를 쓴다
  const today = toKoreanDateString()

  // 그 탭에 있는 정렬 값만 쓴다 — 화면 표시와 요청이 같은 값을 보게(최종 검토 I3)
  const sortBy = normalizeSortBy(activeCommunityTypeTab, searchParams.get('sortBy'))
  // 행사 소식의 상태 드롭다운. 주소에는 소문자(upcoming 등), 서버에는 대문자로 보낸다
  const eventStatusParam = toEventStatusParam(searchParams.get('eventStatus'))
  const eventStatusValue = eventStatusParam?.toLowerCase() ?? 'all'
  const currentKeyword = searchParams.get('communityKeyword') || ''

  const [searchInput, setSearchInput] = useState(currentKeyword)

  // URL의 검색어가 바뀌면(뒤로가기 등) 입력칸을 거기에 맞춘다.
  // SearchBar와 같은 규칙이다 — 렌더 도중에 맞춰야 깜빡임이 없고,
  // 「이전 값과 다를 때만」이어야 치던 글자가 안 지워진다.
  const [prevUrlKeyword, setPrevUrlKeyword] = useState(currentKeyword)
  if (prevUrlKeyword !== currentKeyword) {
    setPrevUrlKeyword(currentKeyword)
    setSearchInput(currentKeyword)
  }

  /**
   * 게시판 탭을 바꾼다. **검색어·정렬은 그대로 들고 간다**(#949).
   *
   * ⚠️ 예전에는 `?tab=` 하나만 써서 주소를 통째로 갈아치웠다. 그러면 검색어와 정렬이
   *    **딸려 나가는 게 아니라 그냥 날아갔다.** 바로 아래 handleSortChange 는 있던 값을
   *    물려받는데 탭만 안 그래서, 같은 파일 안에서 두 방식이 달랐다.
   *
   *    「질문에 없으면 정보 공유엔 있나?」는 아주 흔한 행동이다. 바뀌는 것은
   *    「어디를 볼까」 하나뿐이고, 「무엇을 찾는 중인가」와 「어떻게 늘어놓을까」는 그대로다.
   *    앱도 같이 고쳤다(mobile 의 changeBoardType).
   */
  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    // 아래 handleSortChange 와 같은 상대 주소 방식이다.
    router.replace(`?${params.toString()}`)
  }

  /** 행사 상태를 바꾼다. 전체면 주소에서 뺀다 — 정렬·검색어는 그대로 들고 간다 */
  const handleEventStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('eventStatus')
    } else {
      params.set('eventStatus', value)
    }
    router.push(`?${params.toString()}`)
  }

  const handleSortChange = (sortId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sortBy', sortId)
    router.push(`?${params.toString()}`)
  }

  /** 검색어를 주소에 반영한다. 빈 값이면 아예 뺀다. */
  const applyKeyword = (keyword: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (keyword) {
      params.set('communityKeyword', keyword)
    } else {
      params.delete('communityKeyword')
    }
    router.push(`?${params.toString()}`)
  }

  /**
   * 글자를 칠 때마다 부른다.
   *
   * ⚠️ **비었을 때만 곧바로 반영한다.** 지우기(X)를 누른 것과 같아진다 — 손으로 다 지웠는데
   *    Enter 를 또 눌러야 하면 검색 결과에 갇힌다.
   *
   * ⚠️ 반대로 **글자가 있을 때는 안 건드린다.** 한 글자마다 다시 조회하면 목록이 계속
   *    깜빡인다. 그때는 Enter 를 기다린다.
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setSearchInput(next)
    // 이미 검색어가 없으면 주소를 건드릴 이유가 없다
    if (!next.trim() && currentKeyword) applyKeyword('')
  }

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter') {
      applyKeyword(e.currentTarget.value.trim())
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

  const {
    data: eventData,
    fetchNextPage: fetchNextEvent,
    hasNextPage: hasNextEvent,
    isFetchingNextPage: isFetchingNextEvent,
    isLoading: isLoadingEvent,
    error: errorEvent,
  } = useInfiniteQuery({
    queryKey: ['community', 'event', SEARCH_TYPE, currentKeyword, sortBy, eventStatusParam],
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/community/posts', {
        params: {
          page: pageParam,
          size: 10,
          boardType: 'EVENT',
          searchType: SEARCH_TYPE,
          keyword: currentKeyword || undefined,
          sortBy,
          eventStatus: eventStatusParam,
        },
      })
      return response.data.data
    },
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    initialData: initialEventData ? { pages: [initialEventData], pageParams: [0] } : undefined,
    enabled: isEventTab,
  })

  // 탭마다 따로 불러 둔 것 중 지금 탭의 것을 고른다
  const active = {
    'tab-question': {
      data: questionData,
      isLoading: isLoadingQuestion,
      error: errorQuestion,
      fetchNextPage: fetchNextQuestion,
      hasNextPage: hasNextQuestion,
      isFetchingNextPage: isFetchingNextQuestion,
    },
    'tab-info': {
      data: infoData,
      isLoading: isLoadingInfo,
      error: errorInfo,
      fetchNextPage: fetchNextInfo,
      hasNextPage: hasNextInfo,
      isFetchingNextPage: isFetchingNextInfo,
    },
    'tab-event': {
      data: eventData,
      isLoading: isLoadingEvent,
      error: errorEvent,
      fetchNextPage: fetchNextEvent,
      hasNextPage: hasNextEvent,
      isFetchingNextPage: isFetchingNextEvent,
    },
  }[activeCommunityTypeTab]
  const { data: currentData, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = active

  const communityPosts: CommunityItem[] = currentData?.pages.flatMap((page) => page.content) ?? []

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
      <main className={cn(PAGE_CONTAINER, 'py-5 md:py-8')}>
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

        {/* Search (단독 행). 행사 소식은 검색창이 남은 폭을 다 쓰고 오른쪽에 상태·정렬 드롭다운을 둔다(설계 7-2절).
            휴대폰 폭에서는 드롭다운 두 개만으로 폭의 2/3 를 써서 검색창 아랫줄로 내린다 */}
        <section className={cn('mb-6', isEventTab && 'flex flex-col gap-3 md:flex-row md:items-center md:gap-2')}>
          <div className={cn('relative w-full', isEventTab && 'md:min-w-0 md:flex-1')}>
            <Search size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-[#827565]" />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleSearchSubmit}
              // 행사 글 본문에는 장소·주최·참가비가 들어 있어 지역·동물로 찾는 것이 실제로 잘 된다
              placeholder={isEventTab ? '지역, 행사 이름, 동물로 찾아보세요' : '궁금한 내용을 검색해보세요'}
              enterKeyHint="search"
              className="border-outline-variant/40 bg-surface-container-low focus-visible:border-primary w-full rounded-full border py-2 pr-11 pl-11 text-sm text-[#1c1b1b] placeholder:text-sm placeholder:text-[#827565]"
            />
            {/* 글자가 있을 때만 보인다. 누르면 곧바로 전체 목록으로 돌아간다 */}
            {searchInput ? (
              <button
                type="button"
                aria-label="입력 내용 지우기"
                onClick={() => {
                  setSearchInput('')
                  applyKeyword('')
                }}
                className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-[#827565] hover:text-[#1c1b1b]"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
          {isEventTab ? (
            <div className="flex shrink-0 items-center gap-2 self-end md:self-auto">
              <div className="w-32">
                <SelectDropdown
                  value={eventStatusValue}
                  onChange={handleEventStatusChange}
                  options={EVENT_STATUS_FILTERS.map((filter) => ({ value: filter.value, label: filter.label }))}
                  placeholder="행사 상태"
                  buttonClassName={EVENT_DROPDOWN_CLASS}
                />
              </div>
              <div className="w-36">
                <SelectDropdown
                  value={sortBy}
                  onChange={handleSortChange}
                  options={EVENT_SORT_TYPE.map((sort) => ({ value: sort.id, label: sort.label }))}
                  placeholder="정렬"
                  buttonClassName={EVENT_DROPDOWN_CLASS}
                />
              </div>
            </div>
          ) : null}
        </section>

        {/* Sort filter + 글쓰기 (콘텐츠 컨트롤 행). 행사 소식은 위 검색 줄의 드롭다운을 쓴다 */}
        {isEventTab ? null : (
        <section className="mb-2 flex items-end justify-between gap-3 text-sm md:mb-4">
          <div className="flex items-center gap-3 max-md:ml-auto">
            {getCommunitySortTypes(activeCommunityTypeTab).map((sort, idx) => {
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
          {/* 행사 소식은 일반 글쓰기를 서버가 거절한다. 누르면 반드시 실패하는 단추라 숨긴다 */}
          {hasHydrated && isLogin() && !isEventTab ? (
            <Link
              href={`${ROUTES.COMMUNITY_POST}?tab=${activeCommunityTypeTab}`}
              className="bg-primary-600 hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-opacity hover:opacity-90 active:scale-95 md:flex"
            >
              <PenLine size={16} />
              <span>글쓰기</span>
            </Link>
          ) : null}
        </section>
        )}

        {/* Post list */}
        <SkipToLoadMoreLink targetId="community-posts-load-more" hasNextPage={hasNextPage} />
        <section
          id={`panel-${COMMUNITY_TABS.find((tab) => tab.id === activeCommunityTypeTab)?.code}`}
          role="tabpanel"
          aria-labelledby={activeCommunityTypeTab}
        >
          {communityPosts.length === 0 ? (
            isEventTab ? (
              // 상태를 골랐을 때는 「하나도 없다」로 읽히지 않게 고른 상태를 말한다
              <EmptyState
                icon={CalendarDays}
                title={getEventEmptyTitle(eventStatusParam) ?? '아직 올라온 행사 소식이 없어요'}
                description={eventStatusParam ? '다른 상태를 골라 보세요' : '반려동물 행사 소식을 모아 매일 올려요'}
              />
            ) : (
              <EmptyState icon={MessageSquareText} title="아직 게시글이 없어요" description="첫 번째 이야기를 나눠보세요!" />
            )
          ) : isEventTab ? (
            <ul className="grid grid-cols-1 gap-2 md:gap-4">
              {communityPosts.map((post) => (
                <li key={post.id}>
                  <EventPostCard post={post} today={today} />
                </li>
              ))}
            </ul>
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
                          <div className="bg-chip-surface flex size-9 items-center justify-center rounded-full text-sm font-bold text-primary-600">
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
        <LoadMoreFocusButton
          id="community-posts-load-more"
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
          label="글 더 불러오기"
        />
      </main>

      {/* Mobile FAB — 행사 소식에서는 숨긴다(위 글쓰기 단추와 같은 까닭) */}
      {hasHydrated && isLogin() && !isEventTab ? (
        <Link
          href={`${ROUTES.COMMUNITY_POST}?tab=${activeCommunityTypeTab}`}
          className={cn(
            'bg-primary-600 fixed right-4 bottom-20 flex items-center gap-2 rounded-full px-4 py-3 text-white shadow-lg transition-all hover:brightness-110 active:scale-95 md:hidden',
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
