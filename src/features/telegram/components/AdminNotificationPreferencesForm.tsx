/**
 * Admin Notification Preferences Form
 * Form for editing admin Telegram notification preferences
 * Grouped by notification category with icons for better UX
 */

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Server,
  Network,
  UserPlus,
  CreditCard,
  BarChart3,
  Calendar,
  Clock,
} from "lucide-react";
import { Switch, SwitchThumb } from "@/components/common/Switch";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import type {
  AdminTelegramBindingResponse,
  UpdateAdminPreferencesRequest,
} from "@/api/admin";

const preferencesSchema = z.object({
  notifyNodeOffline: z.boolean(),
  notifyAgentOffline: z.boolean(),
  notifyNewUser: z.boolean(),
  notifyPaymentSuccess: z.boolean(),
  notifyDailySummary: z.boolean(),
  notifyWeeklySummary: z.boolean(),
  offlineThresholdMinutes: z.number().min(3).max(30),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface AdminNotificationPreferencesFormProps {
  binding: AdminTelegramBindingResponse;
  onSubmit: (data: UpdateAdminPreferencesRequest) => Promise<unknown>;
  isSubmitting: boolean;
}

interface PreferenceItemProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description?: string;
  children: React.ReactNode;
}

const PreferenceItem = ({
  icon,
  iconBg,
  label,
  description,
  children,
}: PreferenceItemProps) => (
  <div className="flex items-center gap-3 py-2.5 group cursor-pointer hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors duration-150">
    <div className={`p-1.5 rounded-lg ${iconBg} shrink-0`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-foreground">{label}</div>
      {description && (
        <div className="text-xs text-muted-foreground mt-0.5">
          {description}
        </div>
      )}
    </div>
    {children}
  </div>
);

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section = ({ title, children }: SectionProps) => (
  <div className="space-y-1">
    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 pb-1">
      {title}
    </div>
    <div className="space-y-0.5">{children}</div>
  </div>
);

/**
 * Form for editing admin notification preferences
 */
export const AdminNotificationPreferencesForm = ({
  binding,
  onSubmit,
  isSubmitting,
}: AdminNotificationPreferencesFormProps) => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      notifyNodeOffline: binding.notifyNodeOffline,
      notifyAgentOffline: binding.notifyAgentOffline,
      notifyNewUser: binding.notifyNewUser,
      notifyPaymentSuccess: binding.notifyPaymentSuccess,
      notifyDailySummary: binding.notifyDailySummary,
      notifyWeeklySummary: binding.notifyWeeklySummary,
      offlineThresholdMinutes: binding.offlineThresholdMinutes,
    },
  });

  const notifyNodeOffline = watch("notifyNodeOffline");
  const notifyAgentOffline = watch("notifyAgentOffline");
  const showThreshold = notifyNodeOffline || notifyAgentOffline;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* System Alerts */}
      <Section title="系统告警">
        <PreferenceItem
          icon={<Server className="size-4 text-destructive" />}
          iconBg="bg-destructive/10"
          label="节点离线通知"
          description="当节点离线时发送通知"
        >
          <Controller
            name="notifyNodeOffline"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </PreferenceItem>

        <PreferenceItem
          icon={<Network className="size-4 text-warning" />}
          iconBg="bg-warning/10"
          label="代理离线通知"
          description="当代理离线时发送通知"
        >
          <Controller
            name="notifyAgentOffline"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </PreferenceItem>

        {/* Offline threshold - only show when node or agent offline is enabled */}
        {showThreshold && (
          <PreferenceItem
            icon={<Clock className="size-4 text-muted-foreground" />}
            iconBg="bg-muted"
            label="离线检测阈值"
            description="超过此时间未响应视为离线"
          >
            <div className="flex items-center gap-1.5">
              <Controller
                name="offlineThresholdMinutes"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    min={3}
                    max={30}
                    className="w-14 h-7 text-center text-xs px-1"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 3)
                    }
                  />
                )}
              />
              <span className="text-xs text-muted-foreground">分钟</span>
            </div>
          </PreferenceItem>
        )}
      </Section>

      {/* Business Events */}
      <Section title="业务事件">
        <PreferenceItem
          icon={<UserPlus className="size-4 text-info" />}
          iconBg="bg-info/10"
          label="新用户注册"
          description="当有新用户注册时发送通知"
        >
          <Controller
            name="notifyNewUser"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </PreferenceItem>

        <PreferenceItem
          icon={<CreditCard className="size-4 text-success" />}
          iconBg="bg-success/10"
          label="支付成功"
          description="当用户完成支付时发送通知"
        >
          <Controller
            name="notifyPaymentSuccess"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </PreferenceItem>
      </Section>

      {/* Reports */}
      <Section title="定期报告">
        <PreferenceItem
          icon={<BarChart3 className="size-4 text-primary" />}
          iconBg="bg-primary/10"
          label="每日汇总"
          description="每日发送业务数据汇总"
        >
          <Controller
            name="notifyDailySummary"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </PreferenceItem>

        <PreferenceItem
          icon={<Calendar className="size-4 text-primary" />}
          iconBg="bg-primary/10"
          label="每周汇总"
          description="每周发送业务数据汇总"
        >
          <Controller
            name="notifyWeeklySummary"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </PreferenceItem>
      </Section>

      {/* Save button */}
      {isDirty && (
        <div className="pt-2">
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            保存更改
          </Button>
        </div>
      )}
    </form>
  );
};
