/**
 * Account status card component
 */
import { useTranslation } from 'react-i18next';
import type { UserDisplayInfo } from '@/api/auth';
import { cardStyles, cardHeaderStyles, cardTitleStyles, cardContentStyles, getBadgeClass } from '@/lib/ui-styles';

interface AccountStatusCardProps {
  user: UserDisplayInfo;
}

export const AccountStatusCard = ({ user }: AccountStatusCardProps) => {
  const { t } = useTranslation();

  return (
    <div className={cardStyles}>
      <div className={cardHeaderStyles}>
        <h3 className={cardTitleStyles}>{t('dashboard.accountStatus.title')}</h3>
      </div>
      <div className={cardContentStyles}>
        <div className="space-y-4">
          {/* Account ID */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('dashboard.accountStatus.accountId')}</span>
            <span className="font-mono text-sm font-medium">{user.id}</span>
          </div>

          {/* Role */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('dashboard.accountStatus.role')}</span>
            <span className={getBadgeClass('default')}>
              {user.role === 'admin' ? t('common.role.admin') : t('common.role.user')}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('dashboard.accountStatus.status')}</span>
            <span className={getBadgeClass(user.status === 'active' ? 'success' : 'secondary')}>
              {user.status === 'active' ? t('common.status.active') : user.status === 'inactive' ? t('common.status.inactive') : user.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
