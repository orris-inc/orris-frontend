/**
 * Catalyst-style Table Component
 * Based on Tailwind Plus design specifications
 * @see https://catalyst.tailwindui.com/docs/table
 */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Table context for dense mode
const TableContext = React.createContext<{
  dense: boolean;
  bleed: boolean;
}>({
  dense: false,
  bleed: false,
});

// ============================================================================
// Table
// ============================================================================
interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  dense?: boolean;
  bleed?: boolean;
}

export function Table({
  dense = false,
  bleed = false,
  className,
  children,
  ...props
}: TableProps) {
  return (
    <TableContext.Provider value={{ dense, bleed }}>
      <div className="flow-root">
        <div
          {...props}
          className={cn(
            '-mx-[--gutter] overflow-x-auto whitespace-nowrap',
            className
          )}
        >
          <div
            className={cn(
              'inline-block min-w-full align-middle',
              !bleed && 'sm:px-[--gutter]'
            )}
          >
            <table className="min-w-full text-left text-sm/6">{children}</table>
          </div>
        </div>
      </div>
    </TableContext.Provider>
  );
}

// ============================================================================
// TableHead
// ============================================================================
type TableHeadProps = React.HTMLAttributes<HTMLTableSectionElement>;

export function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <thead
      {...props}
      className={cn('text-muted-foreground', className)}
    />
  );
}

// ============================================================================
// TableBody
// ============================================================================
type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

export function TableBody({ className, ...props }: TableBodyProps) {
  return <tbody {...props} className={className} />;
}

// ============================================================================
// TableRow
// ============================================================================
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  href?: string;
}

export function TableRow({ href, className, children, ...props }: TableRowProps) {
  const { dense } = React.useContext(TableContext);

  const rowClassName = cn(
    'border-b border-border/50 last:border-b-0',
    href && 'cursor-pointer hover:bg-muted/50 transition-colors',
    className
  );

  if (href) {
    return (
      <tr {...props} className={rowClassName}>
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement<TableCellProps>(child) && child.type === TableCell) {
            return React.cloneElement(child, {
              dense,
              // First cell gets the link wrapper
              children:
                index === 0 ? (
                  <Link to={href} className="block">
                    {child.props.children}
                  </Link>
                ) : (
                  child.props.children
                ),
            });
          }
          return child;
        })}
      </tr>
    );
  }

  return (
    <tr {...props} className={rowClassName}>
      {children}
    </tr>
  );
}

// ============================================================================
// TableHeader
// ============================================================================
type TableHeaderProps = React.ThHTMLAttributes<HTMLTableCellElement>;

export function TableHeader({ className, ...props }: TableHeaderProps) {
  const { dense, bleed } = React.useContext(TableContext);

  return (
    <th
      {...props}
      className={cn(
        'border-b border-border/80 font-medium',
        dense ? 'px-4 py-2.5' : 'px-4 py-3.5',
        bleed && 'first:pl-[--gutter] last:pr-[--gutter]',
        'first:pl-[--gutter,1rem] last:pr-[--gutter,1rem] sm:first:pl-1 sm:last:pr-1',
        className
      )}
    />
  );
}

// ============================================================================
// TableCell
// ============================================================================
interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  dense?: boolean;
}

export function TableCell({ className, dense: denseProp, ...props }: TableCellProps) {
  const { dense: contextDense, bleed } = React.useContext(TableContext);
  const dense = denseProp ?? contextDense;

  return (
    <td
      {...props}
      className={cn(
        'text-foreground',
        dense ? 'px-4 py-2.5' : 'px-4 py-4',
        bleed && 'first:pl-[--gutter] last:pr-[--gutter]',
        'first:pl-[--gutter,1rem] last:pr-[--gutter,1rem] sm:first:pl-1 sm:last:pr-1',
        className
      )}
    />
  );
}
