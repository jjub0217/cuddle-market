'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'
import { ChevronDown as DownArrow, Check } from 'lucide-react'
import { Z_INDEX } from '@/constants/ui'

interface SelectProps {
  isOpen: boolean
  disabled: boolean
  onClick: () => void
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void
  id?: string
  buttonClassName?: string
  selectedLabel?: string
  placeholder?: string
  /** 짝이 되는 목록의 id — `aria-controls` 로 이어 준다 */
  listboxId: string
  /** 지금 후보인 항목의 id — 낭독기가 이걸로 「어디에 있는지」를 읽는다 */
  activeOptionId?: string
}

function Select({
  isOpen,
  disabled,
  onClick,
  onKeyDown,
  id,
  buttonClassName,
  selectedLabel,
  placeholder,
  listboxId,
  activeOptionId,
}: SelectProps) {
  return (
    <button
      type="button"
      // ⚠️ **`role="combobox"` 를 준다.** 아래 `aria-activedescendant` 는 단추의 기본 역할
      //    (button)에서는 통하지 않는다 — lint 가 그것을 잡아 준다
      //    (jsx-a11y/role-supports-aria-props). 「목록에서 하나를 고르는 단추」는
      //    W3C 가 정한 **선택 전용 콤보박스** 꼴이고, 그 역할에서만 이 속성이 유효하다.
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-label={placeholder}
      // ⚠️ 열려 있을 때는 **초점이 이 단추에 그대로 남는다.** 항목으로 옮기지 않는다
      //    (그것이 listbox 의 표준 방식이다). 대신 「지금 어느 항목이 후보인가」를
      //    이 두 속성으로 알린다 — 낭독기는 이것을 보고 후보를 읽어 준다.
      aria-controls={isOpen ? listboxId : undefined}
      aria-activedescendant={isOpen ? activeOptionId : undefined}
      disabled={disabled}
      onClick={onClick}
      onKeyDown={onKeyDown}
      id={id}
      className={cn(
        'relative flex w-full items-center cursor-pointer rounded-lg border border-gray-400 bg-white px-3 py-3 pr-10 text-sm disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100/30 disabled:text-gray-300',
        buttonClassName,
      )}
    >
      <span>{selectedLabel || placeholder}</span>
      <div className="absolute top-0 right-3 flex h-full w-9 items-center justify-end">
        <DownArrow className={cn('h-4 w-4 text-gray-400 transition-transform', isOpen && 'rotate-180')} strokeWidth={2} />
      </div>
    </button>
  )
}

interface SelectOptionProps {
  option: { value: string; label: string }
  isSelected: boolean
  /** 방향키로 짚고 있는 「지금 후보」인가 — 고른 것(isSelected)과 다른 개념이다 */
  isActive: boolean
  optionId: string
  onSelect: (value: string) => void
  optionClassName?: string
  optionRef?: React.RefObject<HTMLButtonElement | null>
}

function SelectOption({
  option,
  isSelected,
  isActive,
  optionId,
  onSelect,
  optionClassName,
  optionRef,
}: SelectOptionProps) {
  return (
    <button
      ref={optionRef}
      key={option.value}
      id={optionId}
      role="option"
      type="button"
      aria-selected={isSelected}
      // ⚠️ **Tab 순서에서 뺀다.** `role="option"` 은 방향키로 옮기는 것이 표준이라
      //    Tab 으로 하나씩 걸리면 안 된다. 초점은 여는 단추에 남고, 「지금 어디인가」는
      //    `aria-activedescendant` 로 알린다(#1064).
      tabIndex={-1}
      onClick={() => onSelect(option.value)}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-md p-2 text-left text-sm transition hover:bg-gray-100 focus:outline-none',
        // 고른 것과 지금 후보는 **다르게 보여야 한다.** 고른 것은 옅은 회색,
        // 지금 후보는 테두리로 짚어 준다 — 마우스 hover 와도 구분된다.
        isSelected && 'bg-gray-100',
        isActive && 'border-primary-500 border-[1.2px] bg-gray-100',
        optionClassName,
      )}
    >
      <span>{option.label}</span>
      {isSelected ? <Check size={14} className="shrink-0 text-gray-600" /> : null}
    </button>
  )
}

interface SelectOptionsProps {
  options: { value: string; label: string }[]
  selectedValue: string
  /** 방향키로 짚고 있는 자리 */
  activeIndex: number
  listboxId: string
  optionId: (index: number) => string
  onSelect: (value: string) => void
  placeholder?: string
  optionClassName?: string
  style?: React.CSSProperties
}

function SelectOptions({
  options,
  selectedValue,
  activeIndex,
  listboxId,
  optionId,
  onSelect,
  placeholder,
  optionClassName,
  style,
}: SelectOptionsProps) {
  const listboxRef = useRef<HTMLDivElement>(null)
  const selectedOptionRef = useRef<HTMLButtonElement>(null)
  const activeOptionRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (selectedOptionRef.current && listboxRef.current) {
      const listbox = listboxRef.current
      const selectedOption = selectedOptionRef.current

      const listboxHeight = listbox.clientHeight
      const optionHeight = selectedOption.clientHeight
      const optionTop = selectedOption.offsetTop

      const centerPosition = optionTop - listboxHeight / 2 + optionHeight / 2
      listbox.scrollTop = centerPosition
    }
  }, [])

  // ⚠️ 방향키로 후보를 옮기면 **그 항목이 보이게 목록을 굴려 준다.** 초점은 여는 단추에
  //    남아 있어서 브라우저가 스스로 굴려 주지 않는다 — 손으로 해 줘야 한다.
  //    `block: 'nearest'` 라 이미 보이는 항목에서는 화면이 안 흔들린다.
  useEffect(() => {
    activeOptionRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  return (
    <div
      ref={listboxRef}
      id={listboxId}
      role="listbox"
      aria-label={placeholder}
      style={style}
      className={cn(
        'fixed flex max-h-56 min-w-fit flex-col gap-1 overflow-auto rounded-md border border-gray-400 bg-white p-1 shadow-md',
        Z_INDEX.DROPDOWN,
      )} 
    >
      {options.map((option, index) => {
        const isSelected = selectedValue === option.value
        const isActive = index === activeIndex
        return (
          <SelectOption
            key={option.value}
            option={option}
            isSelected={isSelected}
            isActive={isActive}
            optionId={optionId(index)}
            onSelect={onSelect}
            optionClassName={optionClassName}
            optionRef={isActive ? activeOptionRef : isSelected ? selectedOptionRef : undefined}
          />
        )
      })}
    </div>
  )
}

interface SelectDropdownProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  id?: string
  buttonClassName?: string
  optionClassName?: string
  displayValue?: string
}

export default function SelectDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  id,
  buttonClassName,
  optionClassName,
  displayValue,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLDivElement | null>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>()

  /**
   * 옵션 목록을 담을 곳.
   *
   * `<dialog showModal()>`은 top-layer에 그려져서 z-index로는 못 이긴다.
   * 그래서 dialog 안에서 열렸으면 **그 dialog 안에** 담아야 옵션이 위로 뜨고 눌린다.
   * dialog 밖(일반 페이지)에서는 body에 담는다.
   *
   * 왜 state로 들고 있나: 예전에는 그리는 도중에 `selectRef.current.closest('dialog')`를
   * 읽었는데, 렌더는 순수해야 해서 ref를 읽으면 안 된다(react-hooks/refs).
   * 담을 곳은 **열 때 한 번** 정하면 되므로, 이벤트 처리 함수에서 정해 둔다.
   */
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

  const selectedOption = options.find((option) => option.value === value)
  const selectedIndex = options.findIndex((option) => option.value === value)

  // 방향키로 짚고 있는 자리. 고른 것(`value`)과는 **다른 개념**이다 —
  // 후보를 옮기기만 하고 엔터를 안 치면 고른 값은 그대로다.
  const [activeIndex, setActiveIndex] = useState(-1)

  const 목록id = useId()
  const 항목id = (index: number) => `${목록id}-option-${index}`

  const 열기 = (시작자리: number) => {
    // 여는 순간에만 담을 곳을 다시 본다. 이벤트 처리 함수라 ref를 읽어도 된다.
    setPortalTarget(selectRef.current?.closest('dialog') ?? document.body)
    setActiveIndex(시작자리)
    setIsOpen(true)
  }

  const handleToggle = () => {
    if (disabled) return

    if (isOpen) {
      setIsOpen(false)
      return
    }
    // 열 때는 이미 고른 것에서 시작한다. 고른 게 없으면 맨 위.
    열기(selectedIndex >= 0 ? selectedIndex : 0)
  }

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  /**
   * 여는 단추에서 받는 키. **초점은 늘 이 단추에 있고** 항목으로 옮기지 않는다 —
   * 그것이 `role="listbox"` 의 표준 방식이다(#1064).
   *
   * ⚠️ **방향키에 `preventDefault` 를 꼭 해야 한다.** 안 하면 눌린 키가 브라우저
   *    기본 동작으로 흘러가 **페이지가 위아래로 스크롤된다** — 고치기 전이 그랬다.
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    const 마지막 = options.length - 1
    if (마지막 < 0) return

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault()
        if (!isOpen) {
          열기(selectedIndex >= 0 ? selectedIndex : 0)
          return
        }
        const 걸음 = event.key === 'ArrowDown' ? 1 : -1
        // 끝에서 반대편으로 돌지 않는다 — 어디가 끝인지 손끝으로 알 수 있게.
        setActiveIndex((prev) => Math.min(마지막, Math.max(0, prev + 걸음)))
        return
      }
      case 'Home':
      case 'End': {
        if (!isOpen) return
        event.preventDefault()
        setActiveIndex(event.key === 'Home' ? 0 : 마지막)
        return
      }
      case 'Enter':
      case ' ': {
        if (!isOpen) return // 닫혀 있으면 단추의 기본 동작(열기)에 맡긴다
        event.preventDefault()
        const 고른것 = options[activeIndex]
        if (고른것) handleSelect(고른것.value)
        return
      }
      case 'Tab': {
        // Tab 은 막지 않는다 — 목록을 닫고 다음 자리로 넘어가는 것이 자연스럽다.
        if (isOpen) setIsOpen(false)
        return
      }
      default:
        return
    }
  }

  useEffect(() => {
    if (!isOpen || !selectRef.current) return

    const updatePosition = () => {
      if (!selectRef.current) return
      const rect = selectRef.current.getBoundingClientRect()
      setDropdownStyle({
        top: rect.bottom + 2,
        left: rect.left,
        width: rect.width,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const isInsideTrigger = selectRef.current?.contains(target)
      const isInsideOptions = optionsRef.current?.contains(target)
      if (isOpen && !isInsideTrigger && !isInsideOptions) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div ref={selectRef} className="relative">
      <Select
        isOpen={isOpen}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        id={id}
        buttonClassName={buttonClassName}
        selectedLabel={displayValue || selectedOption?.label}
        placeholder={placeholder}
        listboxId={목록id}
        activeOptionId={activeIndex >= 0 ? 항목id(activeIndex) : undefined}
      />

      {isOpen && !disabled && dropdownStyle && portalTarget
        ? createPortal(
            // fixed로 흐름에서 빼야 함: dialog에 portal될 때 이 wrapper가
            // flex 자식으로 잡혀 gap(예: gap-4=16px)을 추가하는 부작용 방지.
            //
            // ⚠️ **z-index 를 여기에도 준다.** position 이 있고 z-index 가 auto 면 이 감싸개는
            //    「z-index 0」인 자리에 놓이고, **안쪽 목록이 아무리 큰 z 를 가져도 그 자리를
            //    못 벗어난다.** 그래서 z-1 짜리 상품 카드가 목록을 덮었다 —
            //    홈 세부 필터의 시/도 목록이 카드에 잘려 보였다(#869).
            //    안쪽 목록에 z 를 99999 로 올려 봐도 그대로였고, 여기에 주자 해결됐다.
            <div ref={optionsRef} className={cn('fixed', Z_INDEX.DROPDOWN)}>
              <SelectOptions
                options={options}
                selectedValue={value}
                activeIndex={activeIndex}
                listboxId={목록id}
                optionId={항목id}
                onSelect={handleSelect}
                placeholder={placeholder}
                optionClassName={optionClassName}
                style={dropdownStyle}
              />
            </div>,
            // 담을 곳은 열 때 정해 뒀다(위 portalTarget 주석 참고).
            portalTarget
          )
        : null}
    </div>
  )
}
