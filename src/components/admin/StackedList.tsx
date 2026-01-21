import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface StackedListItem {
  id: string | number;
  primary: ReactNode;
  secondary?: ReactNode;
  tertiary?: ReactNode;
  avatar?: ReactNode;
  actions?: ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface StackedListProps {
  items: StackedListItem[];
  className?: string;
  divided?: boolean;
  hoverable?: boolean;
}

/**
 * StackedList - A lightweight list display component for replacing table scenarios
 *
 * Each item displays: avatar (optional) | content (primary, secondary, tertiary) | actions
 * Supports clickable items via href or onClick
 */
export function StackedList({
  items,
  className,
  divided = false,
  hoverable = false,
}: StackedListProps) {
  return (
    <ul
      className={cn('@container', divided && 'divide-y divide-border', className)}
      role="list"
    >
      {items.map((item) => (
        <StackedListRow key={item.id} item={item} hoverable={hoverable} />
      ))}
    </ul>
  );
}

interface StackedListRowProps {
  item: StackedListItem;
  hoverable: boolean;
}

function StackedListRow({ item, hoverable }: StackedListRowProps) {
  const { primary, secondary, tertiary, avatar, actions, href, onClick } = item;

  const content = (
    <div className="flex items-center gap-4 px-4 py-4">
      {avatar && <div className="shrink-0">{avatar}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">
          {primary}
        </div>
        {secondary && (
          <div className="truncate text-sm text-muted-foreground">
            {secondary}
          </div>
        )}
        {tertiary && (
          <div className="mt-1 text-xs text-muted-foreground">{tertiary}</div>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );

  const isClickable = href || onClick;
  const hoverClass = hoverable || isClickable ? 'hover:bg-muted/50' : '';
  const cursorClass = isClickable ? 'cursor-pointer' : '';
  const transitionClass = isClickable || hoverable ? 'transition-colors' : '';

  if (href) {
    return (
      <li>
        <Link
          to={href}
          className={cn('block', hoverClass, transitionClass)}
        >
          {content}
        </Link>
      </li>
    );
  }

  if (onClick) {
    return (
      <li
        onClick={onClick}
        className={cn(hoverClass, cursorClass, transitionClass)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {content}
      </li>
    );
  }

  return (
    <li className={cn(hoverClass, transitionClass)}>
      {content}
    </li>
  );
}
