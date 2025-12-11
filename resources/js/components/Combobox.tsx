import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { Check, ChevronDown, X } from 'lucide-react'
import clsx from 'clsx'
import { useState, ReactNode } from 'react'

export interface SelectOption {
  label: string
  value: string | number
  isDisabled?: boolean
}

interface ComboboxProps<T> {
  // Support both 'items' and 'options' for flexibility
  items?: T[]
  options?: T[]
  value: T | null
  onChange: (value: T | null) => void
  displayValue?: (item: T | null) => string
  filterFunction?: (items: T[], query: string) => T[]
  placeholder?: string
  label?: ReactNode
  // Support both 'disabled' and 'isDisabled'
  disabled?: boolean
  isDisabled?: boolean
  error?: string
  className?: string
  inputClassName?: string
  optionsClassName?: string
  nullable?: boolean
  isClearable?: boolean
  isSearchable?: boolean
  getItemKey?: (item: T) => string | number
}

export default function ComboboxComponent<T>({
  items,
  options,
  value,
  onChange,
  displayValue,
  filterFunction,
  placeholder = 'Select an option...',
  label,
  disabled = false,
  isDisabled = false,
  error,
  className,
  inputClassName = 'form-input',
  optionsClassName,
  nullable = false,
  isClearable = false,
  isSearchable = true,
  getItemKey,
}: ComboboxProps<T>) {
  const [query, setQuery] = useState('')

  // Use either items or options prop
  const dataItems = items ?? options ?? []
  
  // Determine if the component is disabled
  const isComponentDisabled = disabled || isDisabled
  
  // Determine if search should be enabled
  const searchEnabled = isSearchable
  
  // Determine if component is nullable/clearable
  const isNullable = nullable || isClearable

  // Default display value function
  const getDisplayValue = (item: T | null): string => {
    if (!item) return ''
    if (displayValue) return displayValue(item)
    // Check if item has a 'label' property (for SelectOption type)
    if (typeof item === 'object' && item !== null && 'label' in item) {
      return String((item as any).label)
    }
    return String(item)
  }

  // Default filter function that works with string display values
  const defaultFilterFunction = (items: T[], query: string): T[] => {
    if (query === '' || !searchEnabled) return items
    return items.filter((item) => {
      const displayText = getDisplayValue(item)
      return displayText.toLowerCase().includes(query.toLowerCase())
    })
  }

  const filteredItems = filterFunction 
    ? filterFunction(dataItems, query) 
    : defaultFilterFunction(dataItems, query)

  // Generate a unique key for each item
  const getKey = (item: T, index: number): string | number => {
    if (getItemKey) return getItemKey(item)
    if (typeof item === 'object' && item !== null) {
      if ('value' in item) return String((item as any).value)
      if ('id' in item) return (item as any).id
    }
    return index
  }

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block font-medium text-default-900 text-sm mb-2">
          {label}
        </label>
      )}
      
      <Combobox
        value={value}
        onChange={onChange}
        onClose={() => setQuery('')}
        disabled={isComponentDisabled}
        nullable={isNullable}
      >
        <div className="relative">
          <ComboboxInput
            className={clsx(
              // Your custom input classes (defaults to 'form-input')
              inputClassName,
              // Padding adjustments for the buttons (clear + dropdown)
              value && isNullable ? 'pr-16' : 'pr-9'
            )}
            displayValue={getDisplayValue}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            disabled={isComponentDisabled}
            aria-invalid={!!error}
          />
          
          {/* Clear button - only show when there's a value and it's clearable */}
          {value && isNullable && !isComponentDisabled && (
            <button
              type="button"
              className="absolute inset-y-0 right-8 flex items-center px-2 hover:text-default-700 text-default-500 transition-colors"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onChange(null)
                setQuery('')
              }}
              tabIndex={-1}
            >
              <X className="size-4" />
            </button>
          )}
          
          <ComboboxButton className="group absolute inset-y-0 right-0 px-2.5 flex items-center">
            <ChevronDown className="size-4 text-default-500 group-hover:text-default-700 transition-colors" />
          </ComboboxButton>
        </div>

        <ComboboxOptions
          anchor="bottom"
          transition
          className={clsx(
            'w-[var(--input-width)] rounded border border-default-200 bg-card shadow-lg p-1 [--anchor-gap:4px] empty:invisible',
            'transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0',
            'max-h-60 overflow-auto z-50',
            optionsClassName
          )}
        >
          {filteredItems.length === 0 && query !== '' ? (
            <div className="px-3 py-2 text-sm text-default-500">
              No results found.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              // Check if the item is disabled (for SelectOption type)
              const itemDisabled = typeof item === 'object' && item !== null && 'isDisabled' in item 
                ? (item as any).isDisabled 
                : false
              
              return (
                <ComboboxOption
                  key={getKey(item, index)}
                  value={item}
                  disabled={itemDisabled}
                  className={clsx(
                    "group flex cursor-pointer items-center gap-2 rounded px-3 py-2 select-none transition-colors",
                    itemDisabled 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:bg-default-100 data-[focus]:bg-default-100 data-[selected]:bg-primary/10 data-[selected]:text-primary"
                  )}
                >
                  <Check className="invisible size-4 text-primary group-data-[selected]:visible" />
                  <div className="text-sm text-default-800">{getDisplayValue(item)}</div>
                </ComboboxOption>
              )
            })
          )}
        </ComboboxOptions>
      </Combobox>

      {error && (
        <p className="mt-1 text-sm text-danger">{error}</p>
      )}
    </div>
  )
}
