'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, X } from 'lucide-react'
import { CONDITION_ITEMS, PRICE_TYPE, type PriceRange } from '@/constants/constants'
import { CITIES, PROVINCES } from '@/constants/cities'
import { Z_INDEX } from '@/constants/ui'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/utils/cn'
import Button from '@/components/commons/button/Button'

// 좁은 화면의 세부 필터 — 왼쪽에서 밀려 나오는 서랍에 상품 상태 · 가격대 · 지역을 담는다.
//
// 앱의 세부 필터 시트(mobile/components/products/detail-filter-sheet.tsx)를 본떴다.
// 문구·값·고르는 방식을 새로 짓지 않고 그쪽을 그대로 따른다.
//
// ⚠️ **고르는 즉시 반영하지 않는다.** 셋을 모아 고른 뒤 「적용」에서만 밖으로 넘긴다 —
//    앱과 같다. 그냥 닫으면 고르던 것을 버리고 열 때 값으로 되돌아간다.
//    그래서 안에 「고르는 중인 값(draft)」을 따로 들고 있다.
//
// ⚠️ **「초기화」만 즉시 반영한다.** 「다 지우고 처음으로」는 그 자체로 끝난 행동이라,
//    누른 뒤에 「이제 적용을 누르세요」가 한 번 더 필요하면 어색하다.
//    앱도 그렇게 하고(2026-08-06 실기기에서 걸렸다), 웹 데스크탑의 「필터 초기화」도 즉시다.
//
// ⚠️ **지역은 2단계다**(시/도 → 시/군/구). 웹 데스크탑은 드롭다운 둘이지만 서랍은 폭이
//    절반이라 그게 안 들어간다. 앱이 같은 이유로 2단계를 쓴다 — 한 번에 한 목록만 보이면
//    안쪽 스크롤도 필요 없다.

export interface DetailFilterValue {
  productStatus: string | null
  price: PriceRange | null
  sido: string | null
  gugun: string | null
}

interface MobileFilterSidebarProps {
  isOpen: boolean
  onClose: () => void
  /** 열 때의 값. 닫았다 열면 늘 여기로 되돌아간다 */
  value: DetailFilterValue
  /** 「적용」을 눌렀을 때만 부른다. 닫는 것은 받는 쪽이 한다 */
  onApply: (next: DetailFilterValue) => void
  /** 「초기화」 — 즉시 반영한다 */
  onReset: () => void
}

const EMPTY: DetailFilterValue = { productStatus: null, price: null, sido: null, gugun: null }

function isSamePrice(a: PriceRange | null, b: PriceRange | null) {
  if (!a || !b) return a === b
  return a.min === b.min && a.max === b.max
}

export function MobileFilterSidebar({ isOpen, onClose, value, onApply, onReset }: MobileFilterSidebarProps) {
  const [draft, setDraft] = useState<DetailFilterValue>(value)
  // 시/도를 고르면 시/군/구 목록으로 넘어간다. 「뒤로」를 누르면 다시 시/도로.
  const [showProvinces, setShowProvinces] = useState(true)

  // 초점 가둠(#981) — 열면 안으로 넣고, 탭을 서랍 안에서 돌리고, 닫으면 열기 전 자리로 되돌린다.
  //
  // ⚠️ **예전에 여기서 직접 닫기 단추로 초점을 옮겼는데, 그 효과를 지웠다.** 훅도 열 때 초점을
  //    넣어서 둘이 겹치고, 어느 쪽이 이길지가 **효과를 적은 순서**에 달리게 된다 — 줄만 옮겨도
  //    조용히 뒤집히는 코드다. 훅 하나에 맡긴다.
  //    ⚠️ 결과는 예전과 **같다.** 훅은 서랍 안 첫 요소에 초점을 주는데 그게 「필터 닫기」 단추다
  //       (머리글의 h2 는 초점을 못 받는다). 게다가 닫을 때 열기 전 자리로 되돌리는 것은
  //       예전 효과가 안 하던 일이다.
  //    ⚠️ 그래서 서랍에 tabIndex 를 주지 않는다 — 주면 훅이 서랍 자신에게 초점을 준다(훅 주석).
  const 서랍 = useFocusTrap<HTMLElement>(isOpen)

  // 열 때마다 바깥 값으로 되돌린다 — 닫으면서 버린 초안이 남아 있으면 안 된다.
  //
  // ⚠️ **효과(useEffect)가 아니라 렌더 중에 맞춘다.** 효과 안에서 setState 를 하면
  //    렌더가 한 번 더 도는 데다 이 저장소는 그것을 린트로 막아 둔다.
  //    Home.tsx·PetTypeFilter.tsx 가 쓰는 것과 같은 방식이다(리액트 공식 문서의 패턴).
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      // value 는 열리는 순간의 것만 쓴다. 열려 있는 동안 밖이 바뀌어도 초안을 안 덮는다.
      setDraft(value)
      setShowProvinces(true)
    }
  }

  // ESC 로 닫기
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  const 지역단계: 'sido' | 'gugun' = draft.sido && !showProvinces ? 'gugun' : 'sido'

  return (
    <>
      {/* 뒤 그늘 — 누르면 닫힌다. 서랍이 화면의 절반만 가려서 오른쪽 목록이 보인다 */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 bg-black/40 transition-opacity duration-300 lg:hidden',
          Z_INDEX.OVERLAY,
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />
      {/* ⚠️ **닫혀 있는 동안 탭 순서에서 뺀다**(#999). 서랍은 닫혀도 DOM 에 남아(왼쪽으로 밀어 둘 뿐)
          안의 알약·[초기화][적용] 이 탭 순서에 그대로 있었다 — 초점 테두리는 안 보이는데 엔터는 눌렸다.
          `aria-hidden` 은 화면낭독기에서만 감추고 **초점은 못 막아서** 둘 다 필요하다.
          `visibility: hidden` 은 초점은 막지만 **밀려 나오는 애니메이션을 끊는다** — `inert` 는 시각에 영향이 없다.
          뒤 그늘은 안 건드린다. 초점 줄 것이 없고 이미 `pointer-events-none` 이다. */}
      <aside
        ref={서랍}
        role="dialog"
        aria-modal="true"
        aria-label="세부 필터"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          // ⚠️ 폭은 화면의 80% 다. 절반이면 시/군/구 이름이 두 줄로 접혔다.
          //    그래도 오른쪽 20% 는 남긴다 — 뒤에 목록이 비쳐야 「무엇을 거르는 중인지」가
          //    보이고, 그 자리를 눌러 닫을 수도 있다(전체를 덮으면 시트와 다를 게 없다).
          'fixed top-0 bottom-0 left-0 flex w-4/5 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden',
          Z_INDEX.SIDEBAR,
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4">
          <h2 className="text-base font-bold text-gray-900">필터</h2>
          <button type="button" aria-label="필터 닫기" onClick={onClose} className="cursor-pointer p-1">
            <X size={20} className="text-gray-600" />
          </button>
        </header>

        {/* ⚠️ 본문만 줄어들게 둔다(min-h-0). 아래 [초기화][적용] 줄은 안 줄어야 한다 */}
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
          <Section title="상품 상태">
            <div className="flex flex-wrap gap-1.5">
              {CONDITION_ITEMS.map((item) => (
                <Chip
                  key={item.value}
                  label={item.title}
                  isActive={draft.productStatus === item.value}
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, productStatus: prev.productStatus === item.value ? null : item.value }))
                  }
                />
              ))}
            </div>
          </Section>

          <Section title="가격대">
            <div className="flex flex-wrap gap-1.5">
              {PRICE_TYPE.map((item) => (
                <Chip
                  key={item.title}
                  label={item.title}
                  isActive={isSamePrice(draft.price, item.value)}
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, price: isSamePrice(prev.price, item.value) ? null : item.value }))
                  }
                />
              ))}
            </div>
          </Section>

          <Section title="지역">
            {/* ⚠️ 「뒤로」는 제목 **아래**에 둔다. 제목 옆(오른쪽)에 두면 시/도 이름이 길 때
                («강원특별자치도» 처럼) 제목과 한 줄에서 다투다가 접힌다. */}
            {지역단계 === 'gugun' ? (
              <button
                type="button"
                onClick={() => setShowProvinces(true)}
                className="flex w-fit cursor-pointer items-center gap-0.5 text-xs text-gray-500"
              >
                <ChevronLeft size={14} aria-hidden="true" />
                {draft.sido}
              </button>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              {지역단계 === 'sido'
                ? PROVINCES.map((sido) => (
                    <Chip
                      key={sido}
                      label={sido}
                      isActive={draft.sido === sido}
                      onClick={() => {
                        setDraft((prev) => ({ ...prev, sido, gugun: null }))
                        setShowProvinces(false)
                      }}
                    />
                  ))
                : (CITIES[draft.sido as keyof typeof CITIES] ?? []).map((gugun) => (
                    <Chip
                      key={gugun}
                      label={gugun}
                      isActive={draft.gugun === gugun}
                      onClick={() => setDraft((prev) => ({ ...prev, gugun: prev.gugun === gugun ? null : gugun }))}
                    />
                  ))}
            </div>
          </Section>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-gray-200 px-4 py-3">
          <Button
            type="button"
            size="md"
            onClick={() => {
              setDraft(EMPTY)
              setShowProvinces(true)
              onReset()
            }}
            className="flex-1 cursor-pointer border border-gray-300 bg-white text-sm font-medium text-gray-700"
          >
            초기화
          </Button>
          <Button
            type="button"
            size="md"
            onClick={() => onApply(draft)}
            className="flex-1 cursor-pointer bg-[#825500] text-sm font-medium text-white"
          >
            적용
          </Button>
        </div>
      </aside>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[13px] font-bold text-gray-900">{title}</h3>
      {children}
    </section>
  )
}

function Chip({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        // 알약 모양·크기는 소분류 알약(PetTypeFilter)과 같은 값이다 — 한 화면에서 따로 놀지 않게.
        'h-[26px] cursor-pointer rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors',
        isActive
          ? 'border-[#825500] bg-[#825500] text-white'
          : 'border-outline-variant bg-white text-gray-600 hover:border-[#825500] hover:text-[#825500]'
      )}
    >
      {label}
    </button>
  )
}
