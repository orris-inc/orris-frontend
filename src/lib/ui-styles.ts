/**
 * 通用 UI 样式工具
 * 提供常用组件的 Tailwind CSS 类名，用于替代 shadcn/ui 组件
 */

import { cn } from '@/lib/utils';

/**
 * Button 样式变体
 */
export const buttonVariants = {
    default: 'inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]',
    destructive: 'inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]',
    outline: 'inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-1 ring-border bg-background hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
    secondary: 'inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]',
    ghost: 'inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
    link: 'inline-flex items-center justify-center text-sm font-medium underline-offset-4 hover:underline text-primary',
};

export const buttonSizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10',
};

/**
 * Input 样式
 * - h-11: 44px touch target for mobile
 * - text-base: 16px prevents iOS auto-zoom on focus
 * - focus-visible: only show focus ring on keyboard navigation
 * - ring-inset: prevents ring from being clipped by overflow containers
 */
export const inputStyles = 'flex h-11 w-full rounded-xl ring-1 ring-border bg-background px-3 py-2 text-base file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Select Trigger 样式
 * - ring-inset: prevents ring from being clipped by overflow containers
 * - data-[state=open]: visual feedback when dropdown is open
 */
export const selectTriggerStyles = 'flex h-11 w-full items-center justify-between rounded-xl ring-1 ring-border bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[state=open]:ring-2 data-[state=open]:ring-ring data-[state=open]:ring-inset disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1';

/**
 * Label 样式
 */
export const labelStyles = 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';

/**
 * Card 样式
 */
export const cardStyles = 'rounded-xl ring-1 ring-border bg-card text-card-foreground';
export const cardHeaderStyles = 'flex flex-col space-y-1.5 p-6';
export const cardTitleStyles = 'text-2xl font-semibold leading-none tracking-tight';
export const cardDescriptionStyles = 'text-sm text-muted-foreground';
export const cardContentStyles = 'p-6 pt-0';
export const cardFooterStyles = 'flex items-center p-6 pt-0';

/**
 * Badge 样式变体
 */
export const badgeVariants = {
    default: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground',
    success: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-success text-success-foreground hover:bg-success/90',
    warning: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-warning text-warning-foreground hover:bg-warning/90',
    info: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-info text-info-foreground hover:bg-info/90',
};

/**
 * Alert 样式
 */
export const alertStyles = 'relative w-full rounded-xl ring-1 ring-border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground';
export const alertVariants = {
    default: '',
    destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
};
export const alertTitleStyles = 'mb-1 font-medium leading-none tracking-tight';
export const alertDescriptionStyles = 'text-sm [&_p]:leading-relaxed';

/**
 * Textarea 样式
 * - text-base: 16px prevents iOS auto-zoom on focus
 * - focus-visible: only show focus ring on keyboard navigation
 * - ring-inset: prevents ring from being clipped by overflow containers
 */
export const textareaStyles = 'flex min-h-[80px] w-full rounded-xl ring-1 ring-border bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Table 样式
 */
export const tableStyles = 'w-full caption-bottom text-sm';
export const tableHeaderStyles = '[&_tr]:border-b';
export const tableBodyStyles = '[&_tr:last-child]:border-0';
export const tableFooterStyles = 'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0';
export const tableRowStyles = 'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted';
export const tableHeadStyles = 'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0';
export const tableCellStyles = 'p-4 align-middle [&:has([role=checkbox])]:pr-0';
export const tableCaptionStyles = 'mt-4 text-sm text-muted-foreground';

/**
 * 辅助函数：生成 button 类名
 */
export function getButtonClass(variant: keyof typeof buttonVariants = 'default', size: keyof typeof buttonSizes = 'default', className?: string) {
    return cn(buttonVariants[variant], buttonSizes[size], className);
}

/**
 * 辅助函数：生成 badge 类名
 */
export function getBadgeClass(variant: keyof typeof badgeVariants = 'default', className?: string) {
    return cn(badgeVariants[variant], className);
}

/**
 * 辅助函数：生成 alert 类名
 */
export function getAlertClass(variant: keyof typeof alertVariants = 'default', className?: string) {
    return cn(alertStyles, alertVariants[variant], className);
}

/**
 * Mobile Fixed Header 样式
 * 移动端使用 fixed 定位确保 header 固定，桌面端使用 sticky
 *
 * Usage:
 * - header: mobileFixedHeaderStyles.header
 * - main: mobileFixedHeaderStyles.main (with appropriate height variant)
 */
/**
 * Mobile List Item 样式
 * 遵循 Tailwind Application UI 移动端最佳实践:
 * - pointer-coarse: 触摸设备更大的触摸目标
 * - focus-visible: 键盘焦点样式
 * - active: 按下状态反馈
 */
export const mobileListItemStyles = cn(
    // Base layout
    'w-full flex items-center gap-3 p-4 text-left',
    // Touch target: larger padding on touch devices (min 44px height)
    'pointer-coarse:py-4',
    // Interactive states with refined colors
    'hover:bg-accent/50 active:bg-accent',
    // Keyboard focus (only visible on keyboard navigation)
    'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary focus-visible:bg-accent/30',
    // Smooth transitions
    'transition-colors duration-150'
);

/**
 * Mobile List Container 样式
 * Tailwind Application UI 风格的列表容器
 */
export const mobileListContainerStyles = cn(
    'rounded-xl border border-border',
    'bg-card',
    'overflow-hidden',
    'divide-y divide-border'
);

/**
 * Mobile Section Title 样式
 * 用于列表上方的小标题
 */
export const mobileSectionTitleStyles = cn(
    'text-xs font-medium text-muted-foreground uppercase tracking-wide',
    'px-1 py-2'
);

export const mobileFixedHeaderStyles = {
    /**
     * Header 样式
     * - 移动端: fixed 定位 + 玻璃效果 + safe-area
     * - 桌面端: sticky 定位 + 普通背景
     */
    header: cn(
        'z-30',
        // Mobile: fixed positioning + border + glass effect
        'fixed top-0 left-0 right-0 border-b border-border',
        'bg-background/95 backdrop-blur-sm pt-[env(safe-area-inset-top)]',
        // Desktop: sticky + lighter border
        'md:sticky md:left-auto md:right-auto',
        'md:bg-background md:pt-0 md:backdrop-blur-none md:border-border/60'
    ),

    /**
     * Header inner container
     * - Mobile: 44px height (iOS standard)
     * - Desktop: 48px height
     */
    headerInner: cn(
        'flex items-center',
        // Mobile: iOS standard nav bar height 44px
        'h-11 px-2',
        // Desktop: 48px height
        'md:h-12 md:px-4 md:gap-3 lg:px-5'
    ),

    /**
     * Main 内容区域样式 - 小间距版本 (p-3)
     * 移动端需要 padding-top 补偿 fixed header 高度
     */
    mainSmall: cn(
        'flex-1 overflow-x-hidden',
        // Mobile: pt = header(44px/2.75rem) + safe-area + base-padding(0.75rem)
        'p-3 pt-[calc(2.75rem+env(safe-area-inset-top)+0.75rem)]',
        // Desktop: normal padding
        'md:p-4 md:pt-4 lg:p-6 lg:pt-6'
    ),

    /**
     * Main 内容区域样式 - 中等间距版本 (p-4)
     */
    mainMedium: cn(
        'flex-1 overflow-x-hidden pb-safe',
        // Mobile: pt = header(44px/2.75rem) + safe-area + base-padding(1rem)
        'py-4 pt-[calc(2.75rem+env(safe-area-inset-top)+1rem)]',
        // Desktop: normal padding
        'md:pt-4 sm:py-6'
    ),
};

/**
 * Port Range Badge 样式
 * 用于显示 allowedPortRange 的警告色标签
 * 使用 amber 语义色表示限制/警告
 */
export const portRangeBadgeStyles = cn(
    'text-[10px] px-1.5 py-0 shrink-0',
    'border-warning/50 text-warning'
);
