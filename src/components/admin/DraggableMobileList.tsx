/**
 * Draggable Mobile List Component
 * Touch-friendly drag-and-drop with long-press activation
 *
 * Features:
 * - Long-press to activate drag (250ms default)
 * - Visual drag overlay for smooth preview
 * - Drop position indicator
 * - Haptic feedback on drag start/end
 * - Auto-scroll when dragging near edges
 */

import { useState, useMemo, useCallback, memo, type ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

// ============ Sortable Item Component ============

interface SortableItemProps {
  id: string;
  children: ReactNode;
  isDraggingAny: boolean;
  isBeingDragged: boolean;
}

const SortableItemInner = memo(function SortableItemInner({
  id,
  children,
  isDraggingAny,
  isBeingDragged,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Smooth transition for position changes
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Hide the original item when dragging (overlay shows instead)
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'select-none',
        // Dim other items when dragging
        isDraggingAny && !isBeingDragged && 'opacity-50 scale-[0.98]',
        // Transition for smooth dim effect
        'transition-all duration-200 ease-out'
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
});

// ============ Drag Overlay Content ============

interface DragOverlayContentProps {
  children: ReactNode;
}

const DragOverlayContent = memo(function DragOverlayContent({
  children,
}: DragOverlayContentProps) {
  return (
    <div
      className={cn(
        // Elevated appearance
        'shadow-2xl shadow-black/20',
        // Slight scale up
        'scale-[1.03]',
        // Rounded corners with ring
        'ring-2 ring-primary/30 rounded-xl',
        // Smooth rotation hint
        'rotate-[1deg]',
        // Background
        'bg-card'
      )}
    >
      {children}
    </div>
  );
});

// ============ DraggableMobileList Component ============

interface DraggableMobileListProps<TData> {
  items: TData[];
  getItemId: (item: TData) => string;
  renderItem: (item: TData, index: number) => ReactNode;
  onDragEnd?: (activeId: string, overId: string, oldIndex: number, newIndex: number) => void;
  className?: string;
  /** Long press delay in ms (default: 250) */
  longPressDelay?: number;
  /** Enable/disable drag functionality */
  enabled?: boolean;
}

export function DraggableMobileList<TData>({
  items,
  getItemId,
  renderItem,
  onDragEnd,
  className,
  longPressDelay = 250,
  enabled = true,
}: DraggableMobileListProps<TData>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const itemIds = useMemo(() => items.map(getItemId), [items, getItemId]);

  // Find the active item for overlay
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    const index = items.findIndex((item) => getItemId(item) === activeId);
    return index !== -1 ? { item: items[index], index } : null;
  }, [activeId, items, getItemId]);

  // Touch sensor with long-press activation
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: longPressDelay,
        tolerance: 8, // Allow slight movement during long press
      },
    })
  );

  // Haptic feedback helper
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
    // Strong initial vibration
    vibrate([50, 30, 20]);
  }, [vibrate]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id && onDragEnd) {
      const oldIndex = itemIds.indexOf(String(active.id));
      const newIndex = itemIds.indexOf(String(over.id));

      if (oldIndex !== -1 && newIndex !== -1) {
        // Success vibration
        vibrate([30, 20, 30]);
        onDragEnd(String(active.id), String(over.id), oldIndex, newIndex);
      }
    } else {
      // Cancel vibration (short)
      vibrate(20);
    }
  }, [itemIds, onDragEnd, vibrate]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    vibrate(20);
  }, [vibrate]);

  const isDraggingAny = activeId !== null;

  // If not enabled, render without drag functionality
  if (!enabled) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={getItemId(item)}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item, index) => (
            <SortableItemInner
              key={getItemId(item)}
              id={getItemId(item)}
              isDraggingAny={isDraggingAny}
              isBeingDragged={activeId === getItemId(item)}
            >
              {renderItem(item, index)}
            </SortableItemInner>
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay - follows finger smoothly */}
      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeItem ? (
          <DragOverlayContent>
            {renderItem(activeItem.item, activeItem.index)}
          </DragOverlayContent>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
