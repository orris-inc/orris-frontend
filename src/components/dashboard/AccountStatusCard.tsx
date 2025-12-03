/**
 * 账户状态卡片
 */
import type { User } from '@/api/auth';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { cardStyles, cardHeaderStyles, cardTitleStyles, cardContentStyles, getBadgeClass } from '@/lib/ui-styles';

interface AccountStatusCardProps {
  user: User;
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

          {/* 邮箱验证状态 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">邮箱验证</span>
            {user.emailVerified ? (
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">
                  已验证
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-500">
                  未验证
                </span>
              </div>
            )}
          </div>

          {/* OAuth提供商 */}
          {user.oauthProvider && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">登录方式</span>
              <span className={getBadgeClass('default')}>{user.oauthProvider.toUpperCase()}</span>
            </div>
          )}

          {/* 最后更新时间 */}
          {user.updatedAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">最后更新</span>
              <span className="text-sm font-medium">
                {new Date(user.updatedAt).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
