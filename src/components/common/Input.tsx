/**
 * Input 组件
 * 输入框组件，支持 error 状态
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { inputStyles } from '@/lib/ui-styles';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputStyles,
          error && 'border-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
