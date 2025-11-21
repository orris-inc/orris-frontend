import * as Separator from '@radix-ui/react-separator';
import { ChangePasswordForm } from './ChangePasswordForm';

/**
 * 安全设置Tab
 */
export const SecurityTab = () => {
  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">修改密码</h3>
          <p className="text-sm text-muted-foreground">
            设置一个强密码以保护您的账号安全
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <ChangePasswordForm />
          </div>
        </div>
      </div>

      <Separator.Root className="shrink-0 bg-border h-[1px] w-full" />

      {/* OAuth绑定管理（占位） */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">OAuth账号绑定</h3>
          <p className="text-sm text-muted-foreground">
            绑定OAuth账号后可使用快捷登录
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              OAuth绑定管理功能即将推出
            </p>
          </div>
        </div>
      </div>

      <Separator.Root className="shrink-0 bg-border h-[1px] w-full" />

      {/* 危险操作区域（占位） */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-destructive">危险操作</h3>
          <p className="text-sm text-muted-foreground">
            这些操作将永久影响您的账号
          </p>
        </div>

        <div className="rounded-lg border border-destructive/50 bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              账号注销功能即将推出
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
