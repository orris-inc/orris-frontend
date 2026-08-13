/**
 * SubscriptionOrderList - Drag-and-drop ordering of a resource group's subscription
 *
 * Direct nodes and system forward rules share one sort_order sequence (backend change
 * 2026-08-12), so both kinds are listed together and a direct node can sit between
 * forwarded ones. Dropping an entry writes absolute positions taken from the sequence
 * the entries already occupy.
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowRightLeft, GripVertical, Loader2, ListOrdered, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import { computeSortOrderUpdates } from '@/shared/utils/sort-order-utils';
import { useSubscriptionOrder } from '../hooks/useSubscriptionOrder';
import type { SubscriptionOrderItem } from '@/api/node';

// `id` alone is ambiguous: one node can appear as an origin entry and behind a forward rule
const itemKey = (item: SubscriptionOrderItem) => `${item.type}:${item.id}`;

interface SortableOrderRowProps {
  item: SubscriptionOrderItem;
  index: number;
  disabled: boolean;
}

const SortableOrderRow = ({ item, index, disabled }: SortableOrderRowProps) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemKey(item),
    disabled,
  });

  const isOrigin = item.type === 'origin';

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-lg bg-card',
        'ring-1 ring-border/60',
        isDragging && 'opacity-60 z-10 relative shadow-sm'
      )}
    >
      <button
        type="button"
        aria-label={t('resourceGroups.subscriptionOrder.dragHandle')}
        className={cn(
          'shrink-0 flex items-center justify-center size-7 rounded-md',
          'text-muted-foreground/60 hover:text-foreground hover:bg-muted/60',
          'touch-none cursor-grab active:cursor-grabbing',
          disabled && 'opacity-40 cursor-not-allowed'
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <span className="shrink-0 w-6 text-[11px] tabular-nums text-muted-foreground/60">
        {index + 1}
      </span>

      {isOrigin ? (
        <Server className="size-4 shrink-0 text-primary" />
      ) : (
        <ArrowRightLeft className="size-4 shrink-0 text-warning" />
      )}

      <div className="flex-1 min-w-0">
        <SmartTruncate text={item.name} className="text-[13px] font-medium text-foreground" />
        <SmartTruncate
          text={item.id}
          mono
          className="text-[11px] text-muted-foreground/60"
          font="11px 'SF Mono', ui-monospace, monospace"
          lineHeight={14}
        />
      </div>

      <span
        className={cn(
          'shrink-0 px-2 py-0.5 rounded-lg text-[11px] font-medium ring-1',
          isOrigin
            ? 'ring-primary/30 bg-primary/5 text-primary'
            : 'ring-warning/30 bg-warning/5 text-warning'
        )}
      >
        {isOrigin
          ? t('resourceGroups.subscriptionOrder.typeOrigin')
          : t('resourceGroups.subscriptionOrder.typeForward')}
      </span>

      <span className="shrink-0 w-10 text-right text-[11px] tabular-nums text-muted-foreground/40">
        {item.sortOrder}
      </span>
    </div>
  );
};

export interface SubscriptionOrderListProps {
  /** Resource group SID, null disables loading */
  groupId: string | null;
  enabled?: boolean;
  className?: string;
}

export const SubscriptionOrderList = ({
  groupId,
  enabled = true,
  className,
}: SubscriptionOrderListProps) => {
  const { t } = useTranslation();
  const { items, isLoading, reorder, isReordering } = useSubscriptionOrder({ groupId, enabled });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((item) => itemKey(item) === active.id);
      const newIndex = items.findIndex((item) => itemKey(item) === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...items];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      // Positions are absolute in the shared sequence: redistribute the ones already
      // occupied instead of sending dense 1..N indices.
      const updates = computeSortOrderUpdates(reordered, itemKey, (item) => item.sortOrder);
      if (updates.length === 0) return;

      const byKey = new Map(reordered.map((item) => [itemKey(item), item]));
      await reorder(
        updates.map(({ id, sortOrder }) => ({
          type: byKey.get(id)!.type,
          id: byKey.get(id)!.id,
          sortOrder,
        }))
      );
    },
    [items, reorder]
  );

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-8 text-muted-foreground',
          className
        )}
      >
        <ListOrdered className="size-7 mb-2 text-muted-foreground/60" />
        <p className="text-[13px]">{t('resourceGroups.subscriptionOrder.empty')}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground/60">
          {t('resourceGroups.subscriptionOrder.hint')}
        </p>
        {isReordering && (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground/60" />
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(itemKey)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-0.5">
            {items.map((item, index) => (
              <SortableOrderRow
                key={itemKey(item)}
                item={item}
                index={index}
                disabled={isReordering}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
