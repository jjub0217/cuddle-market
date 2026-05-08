/**
 * 새 홈 디자인의 카드형 필터 칩 스타일 (베이지/브라운 톤).
 *
 * `ProductStateFilter`, `PriceFilter` 등 chip 형태로 단일 선택 가능한
 * 필터들이 `variant="card-chip"` 모드일 때 공통으로 사용한다.
 *
 * 색상 raw hex(`#825500` 등)는 차후 디자인 토큰화 작업(옵션 B)에서
 * `bg-brand-700` 등 Tailwind 유틸로 일괄 교체될 예정.
 */
export const CARD_CHIP_STYLES = {
  container: 'flex flex-wrap gap-2',
  chip: 'cursor-pointer rounded-lg border px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-all',
  chipActive: 'border-[#825500] bg-[#825500] text-white',
  chipInactive:
    'border-[#d4c4b2] bg-[#f6f3f2] text-gray-700 hover:border-[#825500] hover:text-[#825500]',
} as const
