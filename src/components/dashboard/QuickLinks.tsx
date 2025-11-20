/**
 * 快速链接卡片
 * 提供实用的导航链接
 */

import { User, CreditCard, Database, Tag, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/auth-store';

interface QuickLink {
  icon: React.ReactNode;
  title: string;
  description: string;
  path?: string; // 可选，如果没有则表示待实现
  adminOnly?: boolean;
  implemented: boolean; // 是否已实现
}

export const QuickLinks = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const links: QuickLink[] = [
    {
      icon: <User className="size-5" />,
      title: '个人设置',
      description: '管理您的个人信息和偏好',
      path: '/dashboard/profile',
      implemented: true,
    },
    {
      icon: <CreditCard className="size-5" />,
      title: '订阅管理',
      description: '查看和管理您的订阅计划',
      implemented: false, // 待实现
    },
    {
      icon: <Database className="size-5" />,
      title: '节点管理',
      description: '管理您的节点配置',
      path: '/admin/nodes',
      adminOnly: true,
      implemented: true,
    },
    {
      icon: <Tag className="size-5" />,
      title: '价格方案',
      description: '浏览可用的订阅套餐',
      path: '/pricing',
      implemented: true,
    },
  ];

  // 根据用户权限过滤链接
  const visibleLinks = links.filter((link) => !link.adminOnly || isAdmin);

  const handleLinkClick = (link: QuickLink) => {
    if (link.implemented && link.path) {
      navigate(link.path);
    }
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-5">快速访问</h3>

        <div className="space-y-3">
          {visibleLinks.map((link, index) => (
            <Button
              key={index}
              onClick={() => handleLinkClick(link)}
              variant="outline"
              disabled={!link.implemented}
              className={`h-auto w-full justify-start p-4 text-left transition-all ${
                link.implemented
                  ? 'hover:border-primary hover:bg-accent/50 hover:shadow-sm cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`flex items-center justify-center size-11 rounded-xl transition-colors ${
                    link.implemented
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`font-semibold text-sm ${
                        link.implemented ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {link.title}
                    </span>
                    {!link.implemented && (
                      <Badge variant="outline" className="h-5 text-xs px-2">
                        待实现
                      </Badge>
                    )}
                  </div>
                  <span
                    className={`text-xs line-clamp-1 ${
                      link.implemented ? 'text-muted-foreground' : 'text-muted-foreground/60'
                    }`}
                  >
                    {link.description}
                  </span>
                </div>
                {link.implemented && <ArrowRight className="size-5 ml-2 text-muted-foreground group-hover:text-primary transition-colors" />}
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
