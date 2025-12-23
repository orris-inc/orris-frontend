import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import type { TelegramBinding, UpdatePreferencesRequest } from '@/api/telegram';

const preferencesSchema = z.object({
  notifyExpiring: z.boolean(),
  notifyTraffic: z.boolean(),
  expiringDays: z.number().min(1, '最小为 1 天').max(30, '最大为 30 天'),
  trafficThreshold: z.number().min(1, '最小为 1%').max(100, '最大为 100%'),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface NotificationPreferencesFormProps {
  binding: TelegramBinding;
  onSubmit: (data: UpdatePreferencesRequest) => Promise<unknown>;
  isSubmitting: boolean;
}

/**
 * Form for editing notification preferences
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

  const handleFormSubmit = async (data: PreferencesFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Expiring notification */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>订阅到期提醒</Label>
            <p className="text-sm text-muted-foreground">
              在订阅即将到期时通过 Telegram 发送提醒
            </p>
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

        {notifyExpiring && (
          <div className="ml-4 pl-4 border-l-2 border-muted">
            <Label htmlFor="expiringDays">提前提醒天数</Label>
            <div className="flex items-center gap-2 mt-2">
              <Controller
                name="expiringDays"
                control={control}
                render={({ field }) => (
                  <Input
                    id="expiringDays"
                    type="number"
                    min={1}
                    max={30}
                    className="w-20"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  />
                )}
              />
              <span className="text-sm text-muted-foreground">天</span>
            </div>
          </div>
        )}
      </div>

      {/* Traffic notification */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>流量告警通知</Label>
            <p className="text-sm text-muted-foreground">
              当流量使用超过阈值时发送告警
            </p>
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

        {notifyTraffic && (
          <div className="ml-4 pl-4 border-l-2 border-muted">
            <Label htmlFor="trafficThreshold">流量告警阈值</Label>
            <div className="flex items-center gap-2 mt-2">
              <Controller
                name="trafficThreshold"
                control={control}
                render={({ field }) => (
                  <Input
                    id="trafficThreshold"
                    type="number"
                    min={1}
                    max={100}
                    className="w-20"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  />
                )}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <Button type="submit" disabled={!isDirty || isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        保存设置
      </Button>
    </form>
  );
};
