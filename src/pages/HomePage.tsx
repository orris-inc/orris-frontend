/**
 * 首页
 * 登录后的主页面
 */

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { Loader2 } from 'lucide-react';
import { cardStyles, getBadgeClass, getButtonClass } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';

export const HomePage = () => {
  const { user } = useAuthStore();
  const { logout, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl">
        <div className={cardStyles}>
          <div className="p-8">
            <div className="grid gap-6">
              {/* 用户头像 */}
              <div className="flex justify-center">
                <AvatarPrimitive.Root className="size-24 relative flex shrink-0 overflow-hidden rounded-full">
                  <AvatarPrimitive.Image
                    src={user?.avatar}
                    alt={user?.displayName}
                    className="aspect-square h-full w-full"
                  />
                  <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-muted text-4xl">
                    {user?.displayName?.charAt(0).toUpperCase()}
                  </AvatarPrimitive.Fallback>
                </AvatarPrimitive.Root>
              </div>

              {/* 欢迎信息 */}
              <div className="text-center grid gap-2">
                <h1 className="text-4xl font-bold">
                  欢迎回来，{user?.displayName}！
                </h1>
                <p className="text-muted-foreground">
                  您已成功登录 Orris
                </p>
              </div>

              {/* 用户信息 */}
              <div className={cn(cardStyles, "border")}>
                <div className="p-6 grid gap-4">
                  <div className="grid gap-1">
                    <p className="text-sm text-muted-foreground">
                      邮箱
                    </p>
                    <p className="text-base">{user?.email}</p>
                  </div>

                  <div className="grid gap-1">
                    <p className="text-sm text-muted-foreground">
                      账号ID
                    </p>
                    <p className="font-mono text-base">
                      {user?.id}
                    </p>
                  </div>

                  <div className="grid gap-1">
                    <p className="text-sm text-muted-foreground">
                      邮箱验证状态
                    </p>
                    <div>
                      <span className={getBadgeClass(user?.emailVerified ? 'default' : 'secondary')}>
                        {user?.emailVerified ? '已验证' : '未验证'}
                      </span>
                    </div>
                  </div>

                  {user?.oauthProvider && (
                    <div className="grid gap-1">
                      <p className="text-sm text-muted-foreground">
                        OAuth提供商
                      </p>
                      <p className="capitalize text-base">
                        {user.oauthProvider}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 登出按钮 */}
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
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
