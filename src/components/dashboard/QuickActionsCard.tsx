/**
 * 快捷操作卡片
 */
import {
  User,
  Lock,
  Settings,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { cardStyles, cardHeaderStyles, cardTitleStyles, cardContentStyles } from '@/lib/ui-styles';

export const QuickActionsCard = () => {
  const actions = [
    {
      icon: User,
      title: '编辑个人资料',
      description: '更新您的姓名和头像',
      disabled: true,
    },
    {
      icon: Lock,
      title: '修改密码',
      description: '更改您的登录密码',
      disabled: true,
    },
    {
      icon: Bell,
      title: '通知设置',
      description: '管理通知偏好',
      disabled: true,
    },
    {
      icon: Settings,
      title: '账户设置',
      description: '高级账户选项',
      disabled: true,
    },
  ];

  return (
    <div className={cardStyles}>
      <div className={cardHeaderStyles}>
        <h3 className={cardTitleStyles}>快捷操作</h3>
      </div>
      <div className={cardContentStyles}>
        <div className="space-y-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  action.disabled
                    ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`p-2 rounded-full ${
                      action.disabled
                        ? 'bg-gray-200 dark:bg-gray-700'
                        : 'bg-primary/10'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        action.disabled
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-primary'
                      }`}
                    />
                  </div>
                  <div className="ml-4">
                    <p
                      className={`font-medium text-sm ${
                        action.disabled ? 'text-gray-500' : ''
                      }`}
                    >
                      {action.title}
                    </p>
                    <p
                      className={`text-xs ${
                        action.disabled
                          ? 'text-gray-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {action.description}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`h-5 w-5 ${
                    action.disabled
                      ? 'text-gray-400'
                      : 'text-gray-500'
                  }`}
                />
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs italic text-muted-foreground">
          更多功能即将推出
        </p>
      </div>
    </div>
  );
};
