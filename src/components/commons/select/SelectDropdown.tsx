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
        'relative flex w-full items-center cursor-pointer rounded-lg border border-gray-400 px-3 py-3 pr-10 text-sm disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100/30 disabled:text-gray-300',
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
        'flex w-full items-center justify-between gap-2 rounded-md p-2 text-left text-sm transition hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
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

  const selectedOption = options.find((option) => option.value === value)

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev)
    }
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

      {isOpen && !disabled && dropdownStyle
        ? createPortal(
            <div ref={optionsRef}>
              <SelectOptions
                options={options}
                selectedValue={value}
                onSelect={handleSelect}
                placeholder={placeholder}
                optionClassName={optionClassName}
                style={dropdownStyle}
              />
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
