import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface DescriptionListItem {
  label: string;
  value: ReactNode;
}

export interface DescriptionListProps {
  items: DescriptionListItem[];
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * DescriptionList component for displaying key-value pairs in detail pages.
 * Uses CSS Grid for responsive layout with configurable columns.
 */
export function DescriptionList({
  items,
  columns = 1,
  className,
}: DescriptionListProps) {
  // Calculate which items are in the last row based on column count
  const getIsLastRow = (index: number, totalItems: number, cols: number) => {
    const lastRowStartIndex = totalItems - (totalItems % cols || cols);
    return index >= lastRowStartIndex;
  };

  return (
    <dl
      className={cn(
        '@container grid grid-cols-1 gap-x-6 gap-y-4',
        columns === 2 && '@sm:grid-cols-2',
        columns === 3 && '@sm:grid-cols-2 @lg:grid-cols-3',
        className
      )}
    >
      {items.map((item, index) => {
        // For responsive layouts, we need to consider different breakpoints
        // Desktop: use the columns prop
        // Tablet (sm): use 2 columns for columns=2 or 3
        // Mobile: always 1 column
        const isLastRowDesktop = getIsLastRow(index, items.length, columns);
        const isLastRowTablet =
          columns >= 2 ? getIsLastRow(index, items.length, 2) : true;
        const isLastRowMobile = index === items.length - 1;

        return (
          <div
            key={index}
            className={cn(
              'py-4',
              // Mobile: border on all except last
              !isLastRowMobile && 'border-b border-border',
              // Tablet (sm): remove border for last row items when columns >= 2
              columns >= 2 && isLastRowTablet && '@sm:border-b-0',
              // Desktop (lg): adjust for 3 columns
              columns === 3 && !isLastRowDesktop && '@lg:border-b',
              columns === 3 && isLastRowDesktop && '@lg:border-b-0'
            )}
          >
            <dt className="text-sm font-medium text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-1 text-sm text-foreground">{item.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
