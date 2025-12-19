/**
 * 用户个人信息卡片
 */
import * as Avatar from '@radix-ui/react-avatar';
import type { UserDisplayInfo } from '@/api/auth';
import { cardStyles, cardContentStyles, getBadgeClass } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';

interface UserInfoCardProps {
  user: UserDisplayInfo;
}

export const UserInfoCard = ({ user }: UserInfoCardProps) => {
  const displayName = user.displayName || user.email?.split('@')[0] || '用户';
  const avatarText = user.initials || user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase();

  return (
    <div className={cardStyles}>
      <div className={cn(cardContentStyles, 'p-6')}>
        <div className="flex flex-col items-center space-y-4">
          {/* 用户头像 */}
          <Avatar.Root className="h-24 w-24 border-4 border-background shadow-lg rounded-full overflow-hidden">
            <Avatar.Fallback className="flex h-full w-full items-center justify-center text-3xl bg-primary/20 text-primary">
              {avatarText}
            </Avatar.Fallback>
          </Avatar.Root>

          {/* 用户名 */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1.5">
              <h2 className="text-xl font-bold">{displayName}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          </div>

          {/* 角色标签 */}
          <span className={getBadgeClass('outline')}>
            {user.role === 'admin' ? '管理员' : '用户'}
          </span>
        </div>
      </div>
    </div>
  );
};
