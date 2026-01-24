/**
 * Textarea 组件
 * 多行文本输入框组件
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { textareaStyles } from '@/lib/ui-styles';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          textareaStyles,
          error && 'border-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
