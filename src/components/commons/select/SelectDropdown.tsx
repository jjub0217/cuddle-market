'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'
import { ChevronDown as DownArrow, Check } from 'lucide-react'
import { Z_INDEX } from '@/constants/ui'

interface SelectProps {
  isOpen: boolean
  disabled: boolean
  onClick: () => void
  id?: string
  buttonClassName?: string
  selectedLabel?: string
  placeholder?: string
}

function Select({ isOpen, disabled, onClick, id, buttonClassName, selectedLabel, placeholder }: SelectProps) {
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-label={placeholder}
      disabled={disabled}
      onClick={onClick}
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
  onSelect: (value: string) => void
  optionClassName?: string
  optionRef?: React.RefObject<HTMLButtonElement | null>
}

function SelectOption({ option, isSelected, onSelect, optionClassName, optionRef }: SelectOptionProps) {
  return (
    <button
      ref={optionRef}
      key={option.value}
      role="option"
      type="button"
      aria-selected={isSelected}
      onClick={() => onSelect(option.value)}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-md p-2 text-left text-sm transition hover:bg-gray-100 focus-visible:bg-gray-100',
        isSelected && 'bg-gray-100 ring-1 ring-gray-300',
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
  onSelect: (value: string) => void
  placeholder?: string
  optionClassName?: string
  style?: React.CSSProperties
}

function SelectOptions({ options, selectedValue, onSelect, placeholder, optionClassName, style }: SelectOptionsProps) {
  const listboxRef = useRef<HTMLDivElement>(null)
  const selectedOptionRef = useRef<HTMLButtonElement>(null)

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

  return (
    <div
      ref={listboxRef}
      role="listbox"
      aria-label={placeholder}
      style={style}
      className={cn(
        'fixed flex max-h-56 min-w-fit flex-col gap-1 overflow-auto rounded-md border border-gray-400 bg-white p-1 shadow-md',
        Z_INDEX.DROPDOWN,
      )} 
    >
      {options.map((option) => {
        const isSelected = selectedValue === option.value
        return (
          <SelectOption
            key={option.value}
            option={option}
            isSelected={isSelected}
            onSelect={onSelect}
            optionClassName={optionClassName}
            optionRef={isSelected ? selectedOptionRef : undefined}
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

  const handleToggle = () => {
    if (disabled) return

    // 여는 순간에만 담을 곳을 다시 본다. 이벤트 처리 함수라 ref를 읽어도 된다.
    if (!isOpen) {
      setPortalTarget(selectRef.current?.closest('dialog') ?? document.body)
    }
    setIsOpen((prev) => !prev)
  }

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
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
        id={id}
        buttonClassName={buttonClassName}
        selectedLabel={displayValue || selectedOption?.label}
        placeholder={placeholder}
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
