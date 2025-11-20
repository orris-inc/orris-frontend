/**
 * 首页
 * 登录后的主页面
 */

import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export const HomePage = () => {
  const { user } = useAuthStore();
  const { logout, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl">
        <Card>
          <CardContent className="p-8">
            <div className="grid gap-6">
              {/* 用户头像 */}
              <div className="flex justify-center">
                <Avatar className="size-24">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="text-4xl">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* 欢迎信息 */}
              <div className="text-center grid gap-2">
                <h1 className="text-4xl font-bold">
                  欢迎回来，{user?.name}！
                </h1>
                <p className="text-muted-foreground">
                  您已成功登录 Orris
                </p>
              </div>

              {/* 用户信息 */}
              <Card className="border">
                <CardContent className="p-6 grid gap-4">
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
                      <Badge variant={user?.email_verified ? 'default' : 'secondary'}>
                        {user?.email_verified ? '已验证' : '未验证'}
                      </Badge>
                    </div>
                  </div>

                  {user?.oauth_provider && (
                    <div className="grid gap-1">
                      <p className="text-sm text-muted-foreground">
                        OAuth提供商
                      </p>
                      <p className="capitalize text-base">
                        {user.oauth_provider}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 登出按钮 */}
              <div className="flex justify-center mt-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={logout}
                  disabled={isLoading}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  {isLoading && <Loader2 className="animate-spin" />}
                  退出登录
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
