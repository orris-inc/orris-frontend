/**
 * HoverCard component
 * Thin wrapper around Radix UI HoverCard with unified styling
 *
 * Best practices to prevent flickering:
 * 1. Use sideOffset=2 to minimize gap between trigger and content
 * 2. Use longer closeDelay (300ms) to allow mouse movement to content
 * 3. Content has pointer-events to keep hover state when mouse enters
 */

import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

export const HoverCard = HoverCardPrimitive.Root;

export const HoverCardTrigger = HoverCardPrimitive.Trigger;

export const HoverCardPortal = HoverCardPrimitive.Portal;

export const HoverCardContent = ({
  className,
  align = 'center',
  sideOffset = 2,
  collisionPadding = 8,
  ...props
}: ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>) => (
  <HoverCardPrimitive.Portal>
    <HoverCardPrimitive.Content
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(
        'z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </HoverCardPrimitive.Portal>
);
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;
