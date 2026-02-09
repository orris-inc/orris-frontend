/**
 * Telegram Binding Card - Compact Design
 * Displays Telegram binding status with notification preferences
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Unlink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { cn } from '@/lib/utils';
import { cardStyles } from '@/lib/ui-styles';
import { useTelegramBinding } from '../hooks/useTelegramBinding';
import { VerifyCodeSection } from './VerifyCodeSection';
import { NotificationPreferencesForm } from './NotificationPreferencesForm';

/**
 * Main card component for Telegram binding management
 */
export const TelegramBindingCard = () => {
  const { t } = useTranslation();
  const {
    isLoading,
    isNotConfigured,
    isBound,
    binding,
    verifyCode,
    botLink,
    deepBindLink,
    expiresAt,
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
      <div className={cn(cardStyles, 'p-5')}>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  // Feature not configured
  if (isNotConfigured) {
    return (
      <div className={cn(cardStyles, 'p-5')}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="p-2 rounded-lg bg-muted">
            <Send className="size-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{t('notifications.telegram.binding')}</h3>
            <p className="text-sm">{t('notifications.telegram.notConfiguredDesc')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn(cardStyles, 'p-5 space-y-5')}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              isBound ? 'bg-brand-telegram/10' : 'bg-muted'
            )}>
              <Send className={cn(
                'size-5',
                isBound ? 'text-brand-telegram' : 'text-muted-foreground'
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{t('notifications.telegram.binding')}</h3>
                {isBound && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-success/10 text-success">
                    <CheckCircle2 className="size-3" />
                    {t('notifications.status.bound')}
                  </span>
                )}
              </div>
              {isBound && binding?.telegramUsername && (
                <p className="text-sm text-muted-foreground">@{binding.telegramUsername}</p>
              )}
            </div>
          </div>
          {isBound && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUnbindDialog(true)}
              className="text-muted-foreground hover:text-destructive h-8"
            >
              <Unlink className="size-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        {isBound && binding ? (
          <NotificationPreferencesForm
            binding={binding}
            onSubmit={updatePreferences}
            isSubmitting={isUpdating}
          />
        ) : (
          verifyCode && <VerifyCodeSection verifyCode={verifyCode} botLink={botLink} deepBindLink={deepBindLink} expiresAt={expiresAt} />
        )}
      </div>

      {/* Unbind confirmation dialog */}
      <ConfirmDialog
        open={showUnbindDialog}
        onOpenChange={setShowUnbindDialog}
        title={t('notifications.telegram.unbindTitle')}
        description={t('notifications.telegram.unbindDesc')}
        confirmText={t('notifications.telegram.unbind')}
        variant="destructive"
        onConfirm={handleUnbind}
        loading={isUnbinding}
      />
    </>
  );
};
