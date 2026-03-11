/**
 * MobileSwipeCard - iOS-style swipe-to-reveal actions card
 *
 * Implements native iOS swipe gesture pattern:
 * - Swipe left to reveal action buttons
 * - Snap back on release or tap elsewhere
 * - Smooth spring animations
 * - Touch-friendly with proper gesture handling
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface SwipeAction {
  /** Unique key for the action */
  key: string;
  /** Icon element */
  icon: React.ReactNode;
  /** Action label (for accessibility) */
  label: string;
  /** Background color class */
  bgColor: string;
  /** Text/icon color class */
  textColor?: string;
  /** Click handler */
  onClick: () => void;
}

export interface MobileSwipeCardProps {
  /** Card content */
  children: React.ReactNode;
  /** Actions revealed on swipe left */
  actions: SwipeAction[];
  /** Additional CSS classes */
  className?: string;
  /** Disable swipe functionality */
  disabled?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const ACTION_WIDTH = 64; // Width per action button
const SWIPE_THRESHOLD = 40; // Minimum swipe distance to trigger reveal
const VELOCITY_THRESHOLD = 0.3; // Velocity threshold for quick swipes
const DIRECTION_LOCK_THRESHOLD = 10; // Minimum distance to determine swipe direction
const DIRECTION_LOCK_RATIO = 1.5; // Horizontal must be 1.5x greater than vertical to lock horizontal

// ============================================================================
// Component
// ============================================================================

export const MobileSwipeCard = ({
  children,
  actions,
  className,
  disabled = false,
}: MobileSwipeCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTranslateRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  // Direction lock: 'none' = not determined, 'horizontal' = swipe card, 'vertical' = scroll page
  const directionLockRef = useRef<'none' | 'horizontal' | 'vertical'>('none');

  const maxTranslate = actions.length * ACTION_WIDTH;

  // Close card when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setTranslateX(0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    startTranslateRef.current = translateX;
    lastXRef.current = touch.clientX;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
    directionLockRef.current = 'none';
    setIsDragging(true);
  }, [disabled, translateX]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled) return;

    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    const currentTime = Date.now();

    // Determine direction lock if not yet locked
    if (directionLockRef.current === 'none') {
      const deltaX = Math.abs(currentX - startXRef.current);
      const deltaY = Math.abs(currentY - startYRef.current);

      // Wait until we have enough movement to determine direction
      if (deltaX > DIRECTION_LOCK_THRESHOLD || deltaY > DIRECTION_LOCK_THRESHOLD) {
        // Lock to horizontal only if horizontal movement is significantly greater
        if (deltaX > deltaY * DIRECTION_LOCK_RATIO) {
          directionLockRef.current = 'horizontal';
        } else {
          // Default to vertical (scroll) - let the browser handle it
          directionLockRef.current = 'vertical';
          setIsDragging(false);
          return;
        }
      } else {
        // Not enough movement yet, don't process
        return;
      }
    }

    // If locked to vertical, ignore horizontal swipe
    if (directionLockRef.current === 'vertical') {
      return;
    }

    // Prevent page scroll when swiping horizontally
    e.preventDefault();

    // Calculate velocity
    const deltaX = currentX - lastXRef.current;
    const deltaTime = currentTime - lastTimeRef.current;
    if (deltaTime > 0) {
      velocityRef.current = deltaX / deltaTime;
    }

    lastXRef.current = currentX;
    lastTimeRef.current = currentTime;

    // Calculate new translate
    const diff = startXRef.current - currentX;
    let newTranslate = startTranslateRef.current + diff;

    // Clamp translate value with rubber band effect
    if (newTranslate < 0) {
      newTranslate = newTranslate * 0.3; // Rubber band effect when swiping right
    } else if (newTranslate > maxTranslate) {
      newTranslate = maxTranslate + (newTranslate - maxTranslate) * 0.3;
    }

    setTranslateX(newTranslate);
  }, [isDragging, disabled, maxTranslate]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // If direction was never locked to horizontal, just reset
    if (directionLockRef.current !== 'horizontal') {
      return;
    }

    const velocity = velocityRef.current;
    const shouldOpen = velocity < -VELOCITY_THRESHOLD ||
      (Math.abs(velocity) < VELOCITY_THRESHOLD && translateX > SWIPE_THRESHOLD);

    if (shouldOpen && translateX > 0) {
      setIsOpen(true);
      setTranslateX(maxTranslate);
    } else {
      setIsOpen(false);
      setTranslateX(0);
    }
  }, [isDragging, translateX, maxTranslate]);

  // Handle action click
  const handleActionClick = useCallback((action: SwipeAction) => {
    action.onClick();
    // Close after action
    setIsOpen(false);
    setTranslateX(0);
  }, []);

  // Handle content click - close if open
  const handleContentClick = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setTranslateX(0);
    }
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-lg',
        'bg-card',
        'ring-1 ring-border/60',
        className
      )}
    >
      {/* Action buttons (behind content) */}
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: maxTranslate }}
      >
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => handleActionClick(action)}
            aria-label={action.label}
            className={cn(
              'flex flex-col items-center justify-center',
              'h-full',
              'transition-opacity',
              action.bgColor,
              action.textColor || 'text-primary-foreground'
            )}
            style={{ width: ACTION_WIDTH }}
          >
            {action.icon}
            <span className="text-[10px] font-medium mt-1">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Swipeable content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleContentClick}
        className={cn(
          'relative bg-card',
          'touch-pan-y',
          !isDragging && 'transition-transform duration-300 ease-out'
        )}
        style={{
          transform: `translateX(${-translateX}px)`,
          // Use iOS spring timing when not dragging
          transitionTimingFunction: isDragging ? 'linear' : 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

MobileSwipeCard.displayName = 'MobileSwipeCard';
