'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { ChevronDown as DownArrow } from 'lucide-react'
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
        'relative flex w-full cursor-pointer rounded-lg border border-gray-400 px-3 py-3 pr-10 text-sm disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100/30 disabled:text-gray-300',
        buttonClassName,
      )}
    >
      <span>{selectedLabel || placeholder}</span>
      <div className="absolute top-0 right-3 flex h-full w-9 items-center justify-end">
        <DownArrow className="h-4 w-4 text-gray-400" strokeWidth={2} />
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
        'w-full rounded-md p-2 text-left text-sm transition hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
        isSelected && 'bg-gray-100 ring-1 ring-gray-300',
        optionClassName,
      )}
    >
      {option.label}
    </button>
  )
}

interface SelectOptionsProps {
  options: { value: string; label: string }[]
  selectedValue: string
  onSelect: (value: string) => void
  placeholder?: string
  optionClassName?: string
}

function SelectOptions({ options, selectedValue, onSelect, placeholder, optionClassName }: SelectOptionsProps) {
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
      className={cn(
        'absolute top-full left-0 mt-0.5 flex max-h-56 w-full flex-col gap-1 overflow-auto rounded-md border border-gray-400 bg-white p-1 shadow-md',
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
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

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
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (isOpen && selectRef.current && !selectRef.current.contains(target)) {
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
        selectedLabel={selectedOption?.label}
        placeholder={placeholder}
      />

      {isOpen && !disabled && (
        <SelectOptions options={options} selectedValue={value} onSelect={handleSelect} placeholder={placeholder} optionClassName={optionClassName} />
      )}
    </div>
  )
}
