/**
 * Secret Input Component
 * Password field with show/hide toggle
 */

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { cn } from '@/lib/utils';

interface SecretInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SecretInput = ({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: SecretInputProps) => {
  const [show, setShow] = useState(false);
  // If value contains asterisks, it's a masked server value
  const isMasked = value?.includes('*');

  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn('pr-10 font-mono text-sm', className)}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        disabled={disabled || isMasked}
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors',
          disabled || isMasked
            ? 'text-muted-foreground/50 cursor-not-allowed'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        )}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
};
