/**
 * 通用 UI 样式工具
 * 提供常用组件的 Tailwind CSS 类名，用于替代 shadcn/ui 组件
 */

import { cn } from '@/lib/utils';

/**
 * Button 样式变体
 */
export const buttonVariants = {
    default: 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground',
    link: 'inline-flex items-center justify-center text-sm font-medium underline-offset-4 hover:underline text-primary',
};

export const buttonSizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
};

/**
 * Input 样式
 */
export const inputStyles = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Label 样式
 */
export const labelStyles = 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';

/**
 * Card 样式
 */
export const cardStyles = 'rounded-lg border bg-card text-card-foreground shadow-sm';
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
    success: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700',
};

/**
 * Alert 样式
 */
export const alertStyles = 'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground';
export const alertVariants = {
    default: '',
    destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
};
export const alertTitleStyles = 'mb-1 font-medium leading-none tracking-tight';
export const alertDescriptionStyles = 'text-sm [&_p]:leading-relaxed';

/**
 * Textarea 样式
 */
export const textareaStyles = 'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

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
