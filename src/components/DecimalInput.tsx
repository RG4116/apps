import React, { useEffect, useRef, useState } from 'react';

interface DecimalInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: string | number;              // controlled prop from parent
  onChange: (value: string) => void;   // always send string (normalized)
  allowNegative?: boolean;
}

// Utility function to normalize comma/period for calculations
export const toNumber = (s: string): number => {
  if (s === "" || s === undefined || s === null) return 0;
  const normalized = String(s).replace(",", ".");
  const num = Number(normalized);
  return isNaN(num) ? 0 : num;
};

const normalize = (s: string) => s.replace(',', '.');

// Completed numeric value? (e.g. "-12", "3.5", "0,75")
const isCompleteNumber = (s: string) => /^-?\d+(?:[.,]\d+)?$/.test(s);

// Typing state allowed? (e.g. "", "-", ".", "-.", "1.", ".5")
const isEditingNumber = (s: string, allowNegative: boolean) => {
  const sep = '[.,]';
  const neg = allowNegative ? '-?' : '';
  return new RegExp(`^${neg}(?:\\d+(?:${sep}\\d*)?|${sep}\\d*)?$`).test(s);
};

const DecimalInput: React.FC<DecimalInputProps> = ({
  value,
  onChange,
  allowNegative = false,
  className = '',
  placeholder = '0',
  ...props
}) => {
  // local string state for what user sees while typing
  const [text, setText] = useState<string>(
    value === null || value === undefined ? '' : String(value)
  );

  // sync down when parent changes
  const lastPropValue = useRef(value);
  useEffect(() => {
    if (value !== lastPropValue.current) {
      setText(value === null || value === undefined ? '' : String(value));
      lastPropValue.current = value;
    }
  }, [value]);

  const commitToParent = (raw: string) => {
    const s = normalize(raw.trim());
    if (s === '' || s === '-' || s === '.' || s === '-.') {
      onChange(''); // parent will convert via toNumber -> 0 if needed
    } else {
      // if user left trailing dot like "1.", keep it stable (or coerce to "1.0")
      const fixed = /^-?\d+\.$/.test(s) ? s + '0' : s;
      onChange(fixed);
      setText(fixed);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let s = e.target.value;

    // keep only digits, dot/comma, and a single leading '-'
    s = s.replace(/[^\d.,-]/g, '');
    if (!allowNegative) {
      s = s.replace(/-/g, '');
    } else {
      s = s.replace(/(?!^)-/g, ''); // keep '-' only at the start
    }

    // collapse multiple separators into one
    const parts = s.split(/[.,]/);
    if (parts.length > 2) {
      s = parts[0] + '.' + parts.slice(1).join('');
    }

    // allow editing states
    if (isEditingNumber(s, allowNegative)) {
      setText(s);

      // Only propagate to parent when it's a complete number; otherwise wait until blur
      if (isCompleteNumber(s)) {
        onChange(normalize(s));
      }
    }
  };

  const handleBlur = () => {
    commitToParent(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const block = allowNegative ? ['e', 'E', '+'] : ['e', 'E', '+', '-'];
    if (block.includes(e.key)) e.preventDefault();
    if (props.onKeyDown) props.onKeyDown(e);
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).blur(); // prevent number spin
    if (props.onWheel) props.onWheel(e);
  };

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      pattern="[0-9]*[.,]?[0-9]*"
      autoComplete="off"
      enterKeyHint="done"
      lang="en"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      className={`input ${className}`}
      placeholder={placeholder}
    />
  );
};

export default DecimalInput;
