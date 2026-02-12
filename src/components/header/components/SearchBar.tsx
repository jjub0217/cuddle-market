'use client'

import { Search as SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import Input from '@/components/commons/Input'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ROUTES } from '@/constants/routes'

interface SearchBarProps {
  placeholder?: string
  className?: string
  borderColor?: string
  paramName?: string // URL 파라미터 이름 (기본값: 'keyword')
  inputClass?: string
}

export default function SearchBar({
  placeholder = '원하는 반려동물 용품을 검색해보세요',
  borderColor = 'border-gray-100',
  className,
  paramName = 'keyword',
  inputClass,
}: SearchBarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const currentKeyword = searchParams.get(paramName) || ''
  const [keyword, setKeyword] = useState(currentKeyword)
  const isHomePage = pathname === ROUTES.HOME

  function handleKeywordChange(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const target = e.currentTarget
      const searchKeyword = target.value.trim()

      if (isHomePage) {
        // 메인페이지에서는 현재 URL에 쿼리 파라미터만 추가
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
    }
  }

  function handleClearKeyword() {
    setKeyword('')

    if (isHomePage) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete(paramName)
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    }
  }

  // URL이 변경될 때 (뒤로가기, 앞으로가기 등) Input value 동기화
  useEffect(() => {
    setKeyword(currentKeyword)
  }, [currentKeyword])

  return (
    <div className={cn('h-5 flex-1 md:h-10 md:min-w-120', className)} role="search" aria-label={placeholder}>
      <Input
        type="text"
        value={keyword}
        placeholder={placeholder}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeywordChange}
        icon={SearchIcon}
        border
        borderColor={borderColor}
        backgroundColor="bg-white"
        inputClass={inputClass}
        onClear={handleClearKeyword}
      />
    </div>
  )
}
