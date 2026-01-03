/**
 * Notification Preferences Form - Compact Layout
 * Inline form for editing notification preferences
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import type { TelegramBinding, UpdatePreferencesRequest } from '@/api/telegram';

const preferencesSchema = z.object({
  notifyExpiring: z.boolean(),
  notifyTraffic: z.boolean(),
  expiringDays: z.number().min(1).max(30),
  trafficThreshold: z.number().min(1).max(100),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface NotificationPreferencesFormProps {
  binding: TelegramBinding;
  onSubmit: (data: UpdatePreferencesRequest) => Promise<unknown>;
  isSubmitting: boolean;
}

/**
 * Compact form for editing notification preferences
 */
export const NotificationPreferencesForm = ({
  binding,
  onSubmit,
  isSubmitting,
}: NotificationPreferencesFormProps) => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      notifyExpiring: binding.notifyExpiring,
      notifyTraffic: binding.notifyTraffic,
      expiringDays: binding.expiringDays,
      trafficThreshold: binding.trafficThreshold,
    },
  });

  const notifyExpiring = watch('notifyExpiring');
  const notifyTraffic = watch('notifyTraffic');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Expiring notification */}
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">订阅到期提醒</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>提前</span>
            <Controller
              name="expiringDays"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  min={1}
                  max={30}
                  disabled={!notifyExpiring}
                  className="w-14 h-7 text-center text-xs px-1"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                />
              )}
            />
            <span>天通知</span>
          </div>
        </div>
        <Controller
          name="notifyExpiring"
          control={control}
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange}>
              <SwitchThumb />
            </Switch>
          )}
        />
      </div>

      {/* Traffic notification */}
      <div className="flex items-center justify-between gap-4 py-2 border-t">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">流量告警通知</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>超过</span>
            <Controller
              name="trafficThreshold"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  min={1}
                  max={100}
                  disabled={!notifyTraffic}
                  className="w-14 h-7 text-center text-xs px-1"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                />
              )}
            />
            <span>% 时告警</span>
          </div>
        </div>
        <Controller
          name="notifyTraffic"
          control={control}
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange}>
              <SwitchThumb />
            </Switch>
          )}
        />
      </div>

      {/* Save button */}
      {isDirty && (
        <Button type="submit" size="sm" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          保存
        </Button>
      )}
    </form>
  );
};
