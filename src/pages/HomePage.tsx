/**
 * 首页
 * 登录后的主页面
 */

import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { Loader2 } from 'lucide-react';
import { cardStyles, getBadgeClass, getButtonClass } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';

export const HomePage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { logout, isLoading } = useAuth();

  return (
    <div className="min-h-viewport flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl">
        <div className={cardStyles}>
          <div className="p-8">
            <div className="grid gap-6">
              {/* User avatar */}
              <div className="flex justify-center">
                <AvatarPrimitive.Root className="size-24 relative flex shrink-0 overflow-hidden rounded-full">
                  <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-muted text-4xl">
                    {user?.initials || user?.displayName?.charAt(0).toUpperCase()}
                  </AvatarPrimitive.Fallback>
                </AvatarPrimitive.Root>
              </div>

              {/* Welcome message */}
              <div className="text-center grid gap-2">
                <h1 className="text-4xl font-bold">
                  {t('user.home.welcomeBack', { name: user?.displayName })}
                </h1>
                <p className="text-muted-foreground">
                  {t('user.home.loginSuccess')}
                </p>
              </div>

              {/* User info */}
              <div className={cn(cardStyles, "border")}>
                <div className="p-6 grid gap-4">
                  <div className="grid gap-1">
                    <p className="text-sm text-muted-foreground">
                      {t('user.detail.email')}
                    </p>
                    <p className="text-base">{user?.email}</p>
                  </div>

                  <div className="grid gap-1">
                    <p className="text-sm text-muted-foreground">
                      {t('user.home.accountId')}
                    </p>
                    <p className="font-mono text-base">
                      {user?.id}
                    </p>
                  </div>

                  <div className="grid gap-1">
                    <p className="text-sm text-muted-foreground">
                      {t('user.detail.role')}
                    </p>
                    <div>
                      <span className={getBadgeClass('default')}>
                        {user?.role === 'admin' ? t('common.role.admin') : t('common.role.user')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout button */}
              <div className="flex justify-center mt-2">
                <button
                  onClick={logout}
                  disabled={isLoading}
                  className={cn(
                    getButtonClass('outline', 'lg'),
                    "text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  )}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
