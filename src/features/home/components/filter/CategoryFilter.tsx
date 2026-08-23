'use client'

import Image from 'next/image'
import { PRODUCT_CATEGORIES } from '@/constants/constants'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'
import Button from '@/components/commons/button/Button'

interface CategoryFilterProps {
  headingClassName?: string
  selectedCategory?: string | null
}

export function CategoryFilter({ selectedCategory }: CategoryFilterProps) {
  const { searchParams, pathname, push } = useFilterNavigation()

  // 같은 카테고리 재클릭 시 해제(toggle), 다른 카테고리 클릭 시 set
  const handleSelect = (e: React.MouseEvent, code: string) => {
    e.stopPropagation()
    const params = new URLSearchParams(searchParams.toString())
    if (selectedCategory === code) {
      params.delete('categories')
    } else {
      params.set('categories', code)
    }
    push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 pt-3 md:pt-2">
      <div
        className="scrollbar-hide -mx-2 flex items-start gap-3 overflow-x-auto px-2 pb-2 md:gap-5"
        role="group"
        aria-label="상품 카테고리"
      >
        {PRODUCT_CATEGORIES.map((category) => {
          const isActive = selectedCategory === category.code
          return (
            <Button
              key={category.code}
              type="button"
              size="sm"
              onClick={(e) => handleSelect(e, category.code)}
              aria-pressed={isActive}
              // h-auto — 이 단추는 아이콘(64) 위에 이름표(20)를 얹은 세로 배치라
              // 높이를 **내용이 정해야 한다.**
              //
              // ⚠️ p-0 만으로는 안 된다. Button 의 sm 이 h-9(36)라 36 안에 84 를 넣게 되어
              //    아이콘 아래가 잘리고 이름표가 단추 밖으로 밀려난다(#847에서 실제로 그랬다).
              //    tailwind-merge 는 h-* 와 p-* 를 다른 무리로 봐서 p-0 이 h-9 를 못 지운다.
              //    바로 옆 ProductPetTypeTabs 가 같은 함정을 같은 방법으로 푼다.
              className="group flex h-auto shrink-0 flex-col items-center gap-1 rounded-none bg-transparent p-0 transition-all hover:bg-transparent md:min-w-20 md:gap-0"
            >
              <span className="bg-primary-50 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full transition-all group-hover:-translate-y-1 md:h-20 md:w-20 md:overflow-visible md:rounded-none md:bg-transparent">
                {/* ⚠️ `max-w-none` 이 **꼭 있어야 한다.** 테일윈드 기본 스타일이 모든 `<img>` 에
                    `max-width: 100%` 를 건다. 좁은 폭에서 감싸개가 64 라 이 그림은 `w-20`(80)을
                    원해도 **가로만 64 로 깎이고 세로는 80 그대로** 남는다(실측: 64x80).
                    그러면 `next/image` 에 넘긴 80x80 과 어긋나 개발 콘솔에 경고가 뜬다(#1047).
                    ⚠️ **flex 탓이 아니다.** `shrink-0` 을 줘 봤지만(`flexShrink: 0` 까지 확인)
                       크기가 그대로였다. 범인은 `max-width` 였다.
                    ⚠️ **보이는 모습은 안 바뀐다.** 감싸개가 `h-16 w-16 overflow-hidden` 이라
                       어차피 가운데 64x64 만 보인다 — 깎여서 64x80 이든, 안 깎여서 80x80 이든
                       보이는 그림은 같다. 고치기 전후 사진을 견줘 확인했다(2026-08-23). */}
                <Image
                  src={category.iconImage}
                  alt=""
                  width={80}
                  height={80}
                  className="h-20 w-20 max-w-none object-cover md:h-16 md:w-16 md:object-contain"
                />
              </span>
              <span className="text-xs whitespace-nowrap text-gray-600 transition-colors group-hover:text-primary-600 md:text-sm md:font-bold">
                {category.name}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
