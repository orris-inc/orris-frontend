/**
 * System section component (Admin only)
 * Contains system configuration and admin-specific settings
 */

import { useTranslation } from 'react-i18next';
import { Server, Database, HardDrive, RefreshCw } from 'lucide-react';
import { cardTitleStyles, cardDescriptionStyles } from '@/lib/ui-styles';
import { useVersionInfo } from '@/hooks';

export const SystemSection = () => {
  const { t } = useTranslation();
  const { serverVersion, clientVersion } = useVersionInfo();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* System info section */}
      <div className="rounded-xl bg-card border overflow-hidden">
        <div className="flex flex-col space-y-1.5 p-5 sm:p-6 border-b">
          <h3 className={`${cardTitleStyles} text-lg`}>
            {t('profile.system.infoTitle')}
          </h3>
          <p className={`${cardDescriptionStyles} text-sm`}>
            {t('profile.system.infoDesc')}
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <div className="space-y-4">
            {/* Server version */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Server className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('profile.system.serverVersion')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.system.serverVersionDesc')}
                  </p>
                </div>
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {serverVersion || '-'}
              </span>
            </div>

            {/* Client version */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <HardDrive className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('profile.system.clientVersion')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.system.clientVersionDesc')}
                  </p>
                </div>
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {clientVersion || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cache management section */}
      <div className="rounded-xl bg-card border overflow-hidden">
        <div className="flex flex-col space-y-1.5 p-5 sm:p-6 border-b">
          <h3 className={`${cardTitleStyles} text-lg`}>
            {t('profile.system.cacheTitle')}
          </h3>
          <p className={`${cardDescriptionStyles} text-sm`}>
            {t('profile.system.cacheDesc')}
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Database className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t('profile.system.clearCache')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('profile.system.clearCacheDesc')}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
              onClick={() => {
                // Clear local storage cache
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
            >
              <RefreshCw className="size-4" />
              {t('profile.system.clearCacheButton')}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced settings placeholder */}
      <div className="rounded-xl bg-card border overflow-hidden">
        <div className="flex flex-col space-y-1.5 p-5 sm:p-6 border-b">
          <h3 className={`${cardTitleStyles} text-lg`}>
            {t('profile.system.advancedTitle')}
          </h3>
          <p className={`${cardDescriptionStyles} text-sm`}>
            {t('profile.system.advancedDesc')}
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-sm text-muted-foreground">
            {t('profile.system.comingSoon')}
          </p>
        </div>
      </div>
    </div>
  );
};
