/**
 * FloatingActionBar - Stripe/Linear-style floating bulk-action bar
 *
 * Anchored to the bottom-center of the viewport and floats above the table
 * without pushing its content. Slides up on appear. Use for contextual
 * bulk actions that show up while rows are selected.
 */

import { cn } from '@/lib/utils';

interface FloatingActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export const FloatingActionBar = ({ children, className }: FloatingActionBarProps) => (
  <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none pb-safe">
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-2.5 px-3 py-2',
        'surface-floating rounded-lg',
        'animate-in fade-in slide-in-from-bottom-4 duration-200',
        className
      )}
    >
      {children}
    </div>
  </div>
);
