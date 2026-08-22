'use client'

import { Search as SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import Input from '@/components/commons/Input'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ROUTES } from '@/constants/routes'

interface SearchBarProps {
  id?: string
  placeholder?: string
  className?: string
  borderColor?: string
  paramName?: string // URL 파라미터 이름 (기본값: 'keyword')
  inputClass?: string
  wrapperClassName?: string // Input wrapper className 오버라이드 (rounded, bg, border 등)
  onSearch?: () => void // 검색 실행(Enter) 후 호출. 모바일 오버레이 닫기 등에 사용
}

export default function SearchBar({
  id,
  placeholder = '원하는 반려동물 용품을 검색해보세요',
  borderColor = 'border-gray-100',
  className,
  paramName = 'keyword',
  inputClass,
  wrapperClassName,
  onSearch,
}: SearchBarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const currentKeyword = searchParams.get(paramName) || ''
  const [keyword, setKeyword] = useState(currentKeyword)
  const isHomePage = pathname === ROUTES.HOME

  // URL의 검색어가 바뀌면(뒤로가기·앞으로가기 등) 입력칸을 거기에 맞춘다.
  //
  // 예전에는 useEffect로 했는데, 그러면 한 번 그린 뒤에 또 그린다 —
  // 뒤로가기 순간 옛 글자가 잠깐 보였다 바뀐다.
  // 렌더 도중에 맞추면 화면에 내보내기 전에 다시 그려서 깜빡임이 없다.
  //
  // 「이전 값을 기억해 두고 달라졌을 때만」이 핵심이다. 그냥 대입하면 매 렌더마다 돌아
  // 사용자가 치던 글자가 지워진다.
  const [prevUrlKeyword, setPrevUrlKeyword] = useState(currentKeyword)
  if (prevUrlKeyword !== currentKeyword) {
    setPrevUrlKeyword(currentKeyword)
    setKeyword(currentKeyword)
  }

  function handleKeywordChange(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter') {
      // ⚠️ **엔터의 기본 동작을 막는다.** 안 막으면 좁은 폭 검색 오버레이가 닫혔다가 곧바로
      //    다시 열린다. 2026-08-22 에 진짜 크롬으로 재서 알았다:
      //
      //      ① 여기서 오버레이를 닫는다(아래 `onSearch`)
      //      ② `useFocusTrap` 이 초점을 **열었던 자리(헤더 돋보기 단추)로 되돌린다**
      //      ③ 엔터의 기본 동작이 그 단추를 누른다 — `event.detail === 0` 인 클릭이었다
      //      ④ 그 단추는 토글이라 `!prev` 로 **다시 열린다**
      //
      //    「초점을 옮기면 뒤따르는 기본 동작의 대상이 바뀐다」는 함정이다.
      //    `setPointerCapture` 가 뒤따르는 click 의 대상을 바꾸던 것과 같은 종류다.
      e.preventDefault()
      const target = e.currentTarget
      target.blur()
      const searchKeyword = target.value.trim()
      const isCurrentPageSearch = isHomePage || paramName !== 'keyword'

      if (isCurrentPageSearch) {
        // 현재 페이지에서 검색 (메인페이지 또는 커스텀 paramName 사용 시)
        const params = new URLSearchParams(searchParams.toString())
        if (searchKeyword) {
          params.set(paramName, searchKeyword)
        } else {
          params.delete(paramName)
        }
        router.push(`${pathname}?${params.toString()}`)
      } else {
        // 다른 페이지에서는 메인페이지로 이동하면서 검색어 전달
        if (searchKeyword) {
          router.push(`${ROUTES.HOME}?${paramName}=${encodeURIComponent(searchKeyword)}`)
        } else {
          router.push(ROUTES.HOME)
        }
      }
      onSearch?.()
    }
  }

  function handleClearKeyword() {
    setKeyword('')
    const isCurrentPageSearch = isHomePage || paramName !== 'keyword'

    if (isCurrentPageSearch) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete(paramName)
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    }
  }

  return (
    <div className={cn('h-5 flex-1 md:h-10 md:min-w-120', className)} role="search" aria-label={placeholder}>
      <Input
        id={id}
        name={paramName}
        type="text"
        value={keyword}
        placeholder={placeholder}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeywordChange}
        icon={SearchIcon}
        border
        borderColor={borderColor}
        backgroundColor="bg-white"
        enterKeyHint="search"
        inputClass={inputClass}
        wrapperClassName={wrapperClassName}
        onClear={handleClearKeyword}
      />
    </div>
  )
}
