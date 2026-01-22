/**
 * Accordion 组件
 * Radix UI Accordion 的薄封装
 */

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Accordion 根组件属性
 */
type AccordionProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>;

/**
 * AccordionItem 组件属性
 */
interface AccordionItemProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {
  /** Custom class name */
  className?: string;
}

/**
 * AccordionTrigger 组件属性
 */
interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  /** Custom class name */
  className?: string;
}

/**
 * AccordionContent 组件属性
 */
interface AccordionContentProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {
  /** Custom class name */
  className?: string;
}

/**
 * Accordion 根组件
 */
const Accordion = AccordionPrimitive.Root;

/**
 * AccordionItem 组件
 */
const AccordionItem = forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn('border-b', className)} {...props} />
));

AccordionItem.displayName = 'AccordionItem';

/**
 * AccordionTrigger 组件
 * 包含向下箭头图标
 */
const AccordionTrigger = forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          'size-4 shrink-0',
          'transition-transform',
          'duration-[var(--spring-ios-default-duration)]',
          'ease-[var(--spring-ios-default)]',
          'motion-reduce:transition-none',
        )}
      />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));

AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

/**
 * AccordionContent 组件
 * Uses CSS Grid trick for smooth height animation (0 to auto)
 */
const AccordionContent = forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      // CSS Grid trick for smooth height animation (0 to auto)
      'grid text-sm',
      // Grid row transition - smoother than keyframes for height
      'transition-[grid-template-rows,opacity]',
      'duration-[var(--spring-ios-default-duration)]',
      'ease-[var(--spring-ios-default)]',
      // Closed state: 0fr = 0 height
      'data-[state=closed]:grid-rows-[0fr] data-[state=closed]:opacity-0',
      // Open state: 1fr = auto height
      'data-[state=open]:grid-rows-[1fr] data-[state=open]:opacity-100',
      // Respect reduced motion preference
      'motion-reduce:transition-none',
    )}
    {...props}
  >
    {/* Inner wrapper must have overflow:hidden for grid trick to work */}
    <div className={cn('overflow-hidden', className)}>
      <div className="pb-4 pt-0">{children}</div>
    </div>
  </AccordionPrimitive.Content>
));

AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
export type { AccordionProps, AccordionItemProps, AccordionTriggerProps, AccordionContentProps };
