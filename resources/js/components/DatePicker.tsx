import React, { useRef } from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { BaseOptions } from 'flatpickr/dist/types/options';
import { usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';

interface DatePickerProps {
  label?: string;
  value?: string | Date | Date[];
  onChange?: (dates: Date[], dateStr: string) => void;
  options?: Partial<BaseOptions>;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  id?: string;
  ariaInvalid?: boolean;
  required?: boolean;
  error?: string;
  showClearButton?: boolean;
}

interface PageProps extends InertiaPageProps {
  settings: {
    dateFormat: {
      php: string;
      js: string;
    };
  };
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  options = {},
  className,
  inputClassName,
  placeholder = 'Select date...',
  disabled = false,
  readOnly = false,
  name,
  id,
  ariaInvalid = false,
  required = false,
  error,
  showClearButton = true,
}) => {
  const { settings } = usePage<PageProps>().props;
  const flatpickrRef = useRef<Flatpickr>(null);
  
  // Use PHP format since flatpickr format syntax is similar to PHP
  const globalDateFormat = settings?.dateFormat?.php || 'Y-m-d';

  const defaultOptions: Partial<BaseOptions> = {
    dateFormat: globalDateFormat,
    allowInput: true,
    ...options,
  };

  // Use inputClassName if provided, otherwise use className, otherwise default to 'form-input'
  const inputClass = inputClassName || className || 'form-input';

  const handleClear = () => {
    if (flatpickrRef.current?.flatpickr) {
      flatpickrRef.current.flatpickr.clear();
      if (onChange) {
        onChange([], '');
      }
    }
  };

  const showClear = showClearButton && value && !disabled && !readOnly;

  return (
    <div className={className}>
      {label && (
        <label className="block font-medium text-default-900 text-sm mb-2">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        <Flatpickr
          ref={flatpickrRef}
          value={value}
          onChange={onChange}
          options={defaultOptions}
          className={inputClass}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          name={name}
          id={id}
          aria-invalid={ariaInvalid || !!error}
        />
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-default-400 hover:text-default-600 transition-colors"
            aria-label="Clear date"
            tabIndex={-1}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
};

export default DatePicker;

