/**
 * TableHoverCard - Convenient HoverCard component for table cells
 * Provides a consistent hover card experience across data tables
 *
 * Uses a global context to manage hover state, preventing state loss
 * when parent components re-render (e.g., real-time data updates).
 *
 * Architecture:
 * - TableHoverCardProvider: Manages global hover state (which card is open)
 * - TableRowProvider: Provides rowId context for each table row
 * - TableHoverCard: Auto-generates stable hoverKey from rowId + columnKey
 *
 * Usage:
 * 1. Wrap DataTable with TableHoverCardProvider
 * 2. DataTable internally wraps each row with TableRowProvider
 * 3. Use TableHoverCardList/TableHoverCard in cell with columnKey prop
 *
 * Example:
 * ```tsx
 * <TableHoverCardList columnKey="config" items={items}>
 *   {children}
 * </TableHoverCardList>
 * ```
 */

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
  type ComponentPropsWithoutRef,
} from 'react';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/common/HoverCard';
import { cn } from '@/lib/utils';
import { TableRowContext } from './table-hover-card-context';

// ============ Hover State Store ============

interface HoverState {
  /** Currently open hover card ID */
  activeId: string | null;
  /** Open a specific hover card */
  open: (id: string) => void;
  /** Close a specific hover card (only if it's the active one) */
  close: (id: string) => void;
  /** Close any open hover card */
  closeAll: () => void;
}

const createHoverStore = () =>
  createStore<HoverState>((set) => ({
    activeId: null,
    open: (id) => set({ activeId: id }),
    close: (id) => set((state) => (state.activeId === id ? { activeId: null } : state)),
    closeAll: () => set({ activeId: null }),
  }));

type HoverStore = ReturnType<typeof createHoverStore>;

// ============ Hover Context ============

const TableHoverCardContext = createContext<HoverStore | null>(null);

/**
 * Provider for table hover card state management.
 * Wrap your DataTable with this to enable stable hover behavior during data refreshes.
 */
export function TableHoverCardProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<HoverStore | null>(null);
  if (storeRef.current == null) {
    storeRef.current = createHoverStore();
  }
  return (
    <TableHoverCardContext.Provider value={storeRef.current}>
      {children}
    </TableHoverCardContext.Provider>
  );
}

function useHoverStore<T>(selector: (state: HoverState) => T): T | null {
  const store = useContext(TableHoverCardContext);
  const result = useStore(store!, selector);
  if (!store) return null;
  return result;
}

function useHoverStoreApi() {
  return useContext(TableHoverCardContext);
}

// ============ Row Context ============

/**
 * Provider for table row context.
 * DataTable should wrap each row with this to provide rowId.
 */
export function TableRowProvider({
  rowId,
  children,
}: {
  rowId: string;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ rowId }), [rowId]);
  return (
    <TableRowContext.Provider value={value}>
      {children}
    </TableRowContext.Provider>
  );
}

/**
 * Internal hook to get current row ID from context.
 * Returns null if not inside a TableRowProvider.
 */
function useTableRowIdInternal(): string | null {
  const ctx = useContext(TableRowContext);
  return ctx?.rowId ?? null;
}

// ============ TableHoverCard Component ============

interface TableHoverCardProps {
  /** The trigger element (usually the cell content) */
  children: ReactNode;
  /** The hover card content */
  content: ReactNode;
  /**
   * Column key for this hover card (e.g., "config", "version").
   * Combined with rowId from context to create stable hoverKey.
   * If rowId context is not available, this will be used as-is.
   */
  columnKey?: string;
  /**
   * @deprecated Use columnKey instead. Full hoverKey for backward compatibility.
   * If provided, takes precedence over columnKey.
   */
  hoverKey?: string;
  /** Optional class name for the trigger wrapper */
  triggerClassName?: string;
  /** Optional class name for the content */
  contentClassName?: string;
  /** Whether to render content as inline element (default: true for table cells) */
  inline?: boolean;
  /** Delay before opening in ms (default: 200) */
  openDelay?: number;
  /** Delay before closing in ms (default: 300, longer to prevent flicker) */
  closeDelay?: number;
  /** Content alignment */
  align?: ComponentPropsWithoutRef<typeof HoverCardContent>['align'];
  /** Content side */
  side?: ComponentPropsWithoutRef<typeof HoverCardContent>['side'];
  /** Whether the hover card is disabled */
  disabled?: boolean;
}

export function TableHoverCard({
  children,
  content,
  columnKey,
  hoverKey: explicitHoverKey,
  triggerClassName,
  contentClassName,
  inline = true,
  openDelay = 200,
  closeDelay = 300,
  align = 'start',
  side = 'bottom',
  disabled = false,
}: TableHoverCardProps) {
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get rowId from context
  const rowId = useTableRowIdInternal();

  // Generate stable hoverKey: explicit > rowId-columnKey > columnKey > null
  const hoverKey = useMemo(() => {
    if (explicitHoverKey) return explicitHoverKey;
    if (rowId && columnKey) return `${rowId}-${columnKey}`;
    if (columnKey) return columnKey;
    return null;
  }, [explicitHoverKey, rowId, columnKey]);

  // Access global hover store
  const store = useHoverStoreApi();
  const isActive = useHoverStore((s) => hoverKey ? s.activeId === hoverKey : false);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!store || !hoverKey) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    openTimeoutRef.current = setTimeout(() => {
      store.getState().open(hoverKey);
    }, openDelay);
  }, [store, hoverKey, openDelay]);

  const handleMouseLeave = useCallback(() => {
    if (!store || !hoverKey) return;
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    closeTimeoutRef.current = setTimeout(() => {
      store.getState().close(hoverKey);
    }, closeDelay);
  }, [store, hoverKey, closeDelay]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!store || !hoverKey) return;
      if (open) {
        store.getState().open(hoverKey);
      } else {
        store.getState().close(hoverKey);
      }
    },
    [store, hoverKey]
  );

  if (disabled || !content) {
    return <>{children}</>;
  }

  // Fallback: if no provider or no hoverKey, render without controlled hover
  if (!store || !hoverKey) {
    return (
      <span className={cn(inline ? 'inline-flex' : 'flex', 'cursor-default', triggerClassName)}>
        {children}
      </span>
    );
  }

  return (
    <HoverCard open={isActive ?? false} onOpenChange={handleOpenChange}>
      <HoverCardTrigger asChild>
        <span
          className={cn(
            inline ? 'inline-flex' : 'flex',
            'cursor-default',
            triggerClassName
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        align={align}
        side={side}
        sideOffset={2}
        className={cn('w-80', contentClassName)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {content}
      </HoverCardContent>
    </HoverCard>
  );
}

// ============ Preset Variants ============

interface KeyValueItem {
  label: string;
  value: ReactNode;
}

interface TableHoverCardListProps extends Omit<TableHoverCardProps, 'content'> {
  /** Title of the hover card */
  title?: string;
  /** List of key-value items to display */
  items: KeyValueItem[];
  /** Optional footer content */
  footer?: ReactNode;
}

/**
 * TableHoverCardList - Display a list of key-value pairs in hover card
 */
export function TableHoverCardList({
  title,
  items,
  footer,
  contentClassName,
  ...props
}: TableHoverCardListProps) {
  const content = (
    <div className="space-y-2">
      {title && (
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
      )}
      <dl className="space-y-1.5 text-sm">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between gap-4">
            <dt className="text-muted-foreground shrink-0">{item.label}</dt>
            <dd className="text-foreground text-right truncate">{item.value}</dd>
          </div>
        ))}
      </dl>
      {footer && <div className="pt-2 border-t border-border">{footer}</div>}
    </div>
  );

  return (
    <TableHoverCard
      content={content}
      contentClassName={cn('w-72', contentClassName)}
      {...props}
    />
  );
}

interface TableHoverCardDescProps extends Omit<TableHoverCardProps, 'content'> {
  /** Title of the hover card */
  title?: string;
  /** Description text */
  description: ReactNode;
}

/**
 * TableHoverCardDesc - Display a simple title and description
 */
export function TableHoverCardDesc({
  title,
  description,
  contentClassName,
  ...props
}: TableHoverCardDescProps) {
  const content = (
    <div className="space-y-1.5">
      {title && (
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
      )}
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <TableHoverCard
      content={content}
      contentClassName={cn('w-64', contentClassName)}
      {...props}
    />
  );
}
