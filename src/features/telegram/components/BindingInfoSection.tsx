import { MessageCircle, Calendar } from 'lucide-react';
import type { TelegramBinding } from '@/api/telegram';

interface BindingInfoSectionProps {
  binding: TelegramBinding;
}

/**
 * Component displaying bound Telegram account information
 */
export const BindingInfoSection = ({ binding }: BindingInfoSectionProps) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
      <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
        <MessageCircle className="size-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <p className="font-medium">
          {binding.telegramUsername
            ? `@${binding.telegramUsername}`
            : `用户 ID: ${binding.telegramUserId}`}
        </p>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="size-3" />
          <span>绑定于 {formatDate(binding.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
