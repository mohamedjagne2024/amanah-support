import { forwardRef } from 'react';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  id?: string;
  name?: string;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked, onChange, disabled, label, className, id, name }, ref) => {
    return (
      <label
        className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className || ''}`}
      >
        <input
          ref={ref}
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-default-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-default-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        {label && (
          <span className="ms-3 text-sm text-default-700">{label}</span>
        )}
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
