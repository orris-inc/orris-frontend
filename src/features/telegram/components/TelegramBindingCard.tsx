import { useState } from 'react';
import * as Separator from '@radix-ui/react-separator';
import { MessageCircle, Unlink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  cardStyles,
  cardHeaderStyles,
  cardTitleStyles,
  cardDescriptionStyles,
  cardContentStyles,
} from '@/lib/ui-styles';
import { useTelegramBinding } from '../hooks/useTelegramBinding';
import { VerifyCodeSection } from './VerifyCodeSection';
import { BindingInfoSection } from './BindingInfoSection';
import { NotificationPreferencesForm } from './NotificationPreferencesForm';

/**
 * Main card component for Telegram binding management
 */
export const TelegramBindingCard = () => {
  const {
    isLoading,
    isNotConfigured,
    isBound,
    binding,
    verifyCode,
    unbind,
    updatePreferences,
    isUnbinding,
    isUpdating,
  } = useTelegramBinding();

  const [showUnbindDialog, setShowUnbindDialog] = useState(false);

  const handleUnbind = async () => {
    await unbind();
    setShowUnbindDialog(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cardStyles}>
        <div className={cardHeaderStyles}>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className={cardContentStyles}>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Feature not configured on backend
  if (isNotConfigured) {
    return (
      <div className={cardStyles}>
        <div className={`${cardHeaderStyles} bg-muted/50`}>
          <div className="flex items-center gap-2">
            <MessageCircle className="size-5 text-muted-foreground" />
            <h3 className={cardTitleStyles}>Telegram 绑定</h3>
          </div>
          <p className={cardDescriptionStyles}>
            绑定 Telegram 账号后，您可以接收订阅到期提醒和流量告警通知
          </p>
        </div>
        <div className={`${cardContentStyles} pt-6`}>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-muted mb-4">
              <AlertCircle className="size-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Telegram 通知功能暂未启用
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              请联系管理员开启此功能
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cardStyles}>
        {/* Header */}
        <div className={`${cardHeaderStyles} bg-muted/50`}>
          <div className="flex items-center gap-2">
            <MessageCircle className="size-5 text-blue-500" />
            <h3 className={cardTitleStyles}>Telegram 绑定</h3>
          </div>
          <p className={cardDescriptionStyles}>
            绑定 Telegram 账号后，您可以接收订阅到期提醒和流量告警通知
          </p>
        </div>

        <div className={`${cardContentStyles} pt-6`}>
          {isBound && binding ? (
            <div className="space-y-6">
              {/* Binding info */}
              <BindingInfoSection binding={binding} />

              <Separator.Root className="h-[1px] bg-border" />

              {/* Notification preferences */}
              <div>
                <h4 className="text-lg font-medium mb-4">通知偏好设置</h4>
                <NotificationPreferencesForm
                  binding={binding}
                  onSubmit={updatePreferences}
                  isSubmitting={isUpdating}
                />
              </div>

              <Separator.Root className="h-[1px] bg-border" />

              {/* Unbind button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowUnbindDialog(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Unlink className="mr-2 size-4" />
                  解除绑定
                </Button>
              </div>
            </div>
          ) : (
            verifyCode && <VerifyCodeSection verifyCode={verifyCode} />
          )}
        </div>
      </div>

      {/* Unbind confirmation dialog */}
      <ConfirmDialog
        open={showUnbindDialog}
        onOpenChange={setShowUnbindDialog}
        title="解除 Telegram 绑定"
        description="解除绑定后，您将不再通过 Telegram 接收任何通知。确定要继续吗？"
        confirmText="解除绑定"
        variant="destructive"
        onConfirm={handleUnbind}
        loading={isUnbinding}
      />
    </>
  );
};
