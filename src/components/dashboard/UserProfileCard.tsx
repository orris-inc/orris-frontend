/**
 * 用户资料卡片（精简版）
 * 显示头像和快捷设置入口
 */

import { Settings } from 'lucide-react';
import { cardStyles, getButtonClass } from '@/lib/ui-styles';
import { Avatar, AvatarFallback } from '@/components/common/Avatar';
import type { UserDisplayInfo } from '@/api/auth';
import { useNavigate } from 'react-router-dom';

interface UserProfileCardProps {
  user: UserDisplayInfo;
}

export const UserProfileCard = ({ user }: UserProfileCardProps) => {
  const navigate = useNavigate();
  const avatarText = user.initials ||
    user.displayName?.charAt(0).toUpperCase() ||
    user.email?.charAt(0).toUpperCase();

  return (
    <div className={cardStyles}>
      <div className="p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <Avatar className="size-24 ring-4 ring-background shadow-xl">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-3xl font-semibold">
              {avatarText}
            </AvatarFallback>
          </Avatar>

          <button
            onClick={() => navigate('/profile/settings')}
            className={getButtonClass('secondary', 'sm', 'w-full rounded-xl')}
          >
            <Settings className="size-4 mr-2" />
            个人设置
          </button>
        </div>
      </div>
    </div>
  );
};
