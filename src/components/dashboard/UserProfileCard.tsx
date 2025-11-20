/**
 * 用户资料卡片（合并版）
 * 整合用户个人信息和账户状态
 */

import { Verified, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import type { User } from '@/features/auth/types/auth.types';
import { useNavigate } from 'react-router-dom';

interface UserProfileCardProps {
  user: User;
}

export const UserProfileCard = ({ user }: UserProfileCardProps) => {
  const navigate = useNavigate();
  const displayName = user.display_name || user.name || user.email?.split('@')[0] || '用户';
  const avatarText =
    user.initials ||
    user.display_name?.charAt(0).toUpperCase() ||
    user.name?.charAt(0).toUpperCase() ||
    user.email?.charAt(0).toUpperCase();

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* 头部：头像 + 基本信息 */}
          <div className="flex items-start gap-4">
            <Avatar className="size-20 border-4 border-background shadow-lg ring-2 ring-primary/10">
              <AvatarImage src={user.avatar} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-2xl">
                {avatarText}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold truncate">{displayName}</h3>
                {user.email_verified && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Verified className="size-5 text-primary flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>邮箱已验证</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-3 truncate">{user.email}</p>

              {/* OAuth 标签和设置按钮 */}
              <div className="flex items-center justify-between">
                {user.oauth_provider && (
                  <Badge variant="secondary" className="text-xs">
                    {user.oauth_provider.toUpperCase()} 登录
                  </Badge>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/profile/settings')}
                        className="ml-auto"
                      >
                        <Settings className="size-4 mr-1" />
                        设置
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>个人设置</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* 分隔线 */}
          <Separator />

          {/* 账户详细信息 */}
          <div className="space-y-3">
            {/* 账户ID */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground font-medium">账户 ID</span>
              <span className="text-sm font-mono text-foreground">{String(user.id).substring(0, 8)}...</span>
            </div>

            {/* 加入时间 */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground font-medium">加入时间</span>
              <span className="text-sm text-foreground">
                {new Date(user.created_at).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            {/* 最后更新 */}
            {user.updated_at && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground font-medium">最后更新</span>
                <span className="text-sm text-foreground">
                  {new Date(user.updated_at).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
