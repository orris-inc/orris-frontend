/**
 * 账户状态卡片
 */
import type { UserDisplayInfo } from '@/api/auth';
import { cardStyles, cardHeaderStyles, cardTitleStyles, cardContentStyles, getBadgeClass } from '@/lib/ui-styles';

interface AccountStatusCardProps {
  user: UserDisplayInfo;
}

export const AccountStatusCard = ({ user }: AccountStatusCardProps) => {
  return (
    <div className={cardStyles}>
      <div className={cardHeaderStyles}>
        <h3 className={cardTitleStyles}>账户状态</h3>
      </div>
      <div className={cardContentStyles}>
        <div className="space-y-4">
          {/* 账户ID */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">账户 ID</span>
            <span className="font-mono text-sm font-medium">{user.id}</span>
          </div>

          {/* 角色 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">角色</span>
            <span className={getBadgeClass('default')}>
              {user.role === 'admin' ? '管理员' : '用户'}
            </span>
          </div>

          {/* 状态 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">状态</span>
            <span className={getBadgeClass(user.status === 'active' ? 'success' : 'secondary')}>
              {user.status === 'active' ? '正常' : user.status === 'inactive' ? '未激活' : user.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
