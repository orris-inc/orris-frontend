/**
 * Telegram Stat Card Component
 * Displays Telegram binding status in Bento Grid layout
 */

import { Link } from 'react-router';
import { Send, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';

interface TelegramStatCardProps {
  isBound: boolean;
  username?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * Telegram icon component using official brand colors
 * Brand color: #26A5E4 (Telegram Blue)
 */
const TelegramIcon = ({ className }: { className?: string }) => (
  <Send className={cn('size-5', className)} />
);

/**
 * Stat card for displaying Telegram binding status
 * Clickable card that navigates to notification settings
 */
export const TelegramStatCard = ({
  isBound,
  username,
  isLoading = false,
  className,
}: TelegramStatCardProps) => {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn(
        'col-span-2 md:col-span-3',
        'p-5 rounded-xl bg-card border',
        className
      )}>
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-20 mb-1" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  const statusConfig = isBound
    ? {
        status: '已绑定',
        statusClass: 'text-success',
        subtitle: username ? `@${username}` : '接收通知中',
        iconBgClass: 'bg-[#26A5E4]/10 ring-[#26A5E4]/20',
      }
    : {
        status: '未绑定',
        statusClass: 'text-muted-foreground',
        subtitle: '点击绑定接收通知',
        iconBgClass: 'bg-muted ring-border',
      };

  return (
    <Link
      to="/notifications"
      className={cn(
        'col-span-2 md:col-span-3',
        'p-5 rounded-xl bg-card border',
        'transition-all hover:shadow-md hover:border-[#26A5E4]/30',
        'cursor-pointer group',
        className
      )}
    >
      {/* Header with icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg ring-1', statusConfig.iconBgClass)}>
            <TelegramIcon className={isBound ? 'text-[#26A5E4]' : 'text-muted-foreground'} />
          </div>
          <span className="text-sm text-muted-foreground">Telegram</span>
        </div>
        <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Status */}
      <div className={cn('text-lg font-semibold', statusConfig.statusClass)}>
        {statusConfig.status}
      </div>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground mt-1 truncate">
        {statusConfig.subtitle}
      </p>
    </Link>
  );
};
