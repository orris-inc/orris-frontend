/**
 * 用户个人信息卡片
 */
import * as Avatar from '@radix-ui/react-avatar';
import type { User } from '@/api/auth';
import { BadgeCheck } from 'lucide-react';
import { cardStyles, cardContentStyles, getBadgeClass } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';

interface UserInfoCardProps {
  user: User;
}

export const UserInfoCard = ({ user }: UserInfoCardProps) => {
  const displayName = user.displayName || user.email?.split('@')[0] || '用户';
  const avatarText = user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase();

  return (
    <div className={cardStyles}>
      <div className={cn(cardContentStyles, 'p-6')}>
        <div className="flex flex-col items-center space-y-4">
          {/* 用户头像 */}
          <Avatar.Root className="h-24 w-24 border-4 border-background shadow-lg rounded-full overflow-hidden">
            <Avatar.Image src={user.avatar} alt={displayName} className="h-full w-full object-cover" />
            <Avatar.Fallback className="flex h-full w-full items-center justify-center text-3xl bg-primary/20 text-primary">
              {avatarText}
            </Avatar.Fallback>
          </Avatar.Root>

          {/* 用户名 */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1.5">
              <h2 className="text-xl font-bold">{displayName}</h2>
              {user.emailVerified && (
                <BadgeCheck className="h-5 w-5 text-blue-500" />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          </div>

          {/* OAuth标签 */}
          {user.oauthProvider && (
            <span className={getBadgeClass('outline')}>{`${user.oauthProvider.toUpperCase()} 账号`}</span>
          )}

          {/* 加入时间 */}
          <div className="w-full border-t border-border/50 pt-4 text-center">
            <p className="text-xs text-muted-foreground">加入时间</p>
            <p className="text-sm font-medium">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }) : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
