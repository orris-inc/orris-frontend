/**
 * Admin Notification Preferences Form
 * Form for editing admin Telegram notification preferences
 * Grouped by notification category with icons for better UX
 */

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/Select";
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
  dailySummaryHour: z.number().min(0).max(23),
  weeklySummaryHour: z.number().min(0).max(23),
  weeklySummaryWeekday: z.number().min(0).max(6),
  offlineCheckIntervalMinutes: z.number().min(1).max(30),
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
  const { t } = useTranslation();
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
      dailySummaryHour: binding.dailySummaryHour,
      weeklySummaryHour: binding.weeklySummaryHour,
      weeklySummaryWeekday: binding.weeklySummaryWeekday,
      offlineCheckIntervalMinutes: binding.offlineCheckIntervalMinutes,
    },
  });

  const notifyNodeOffline = watch("notifyNodeOffline");
  const notifyAgentOffline = watch("notifyAgentOffline");
  const notifyDailySummary = watch("notifyDailySummary");
  const notifyWeeklySummary = watch("notifyWeeklySummary");
  const showOfflineSettings = notifyNodeOffline || notifyAgentOffline;

  // Hour options for selects (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i.toString(),
    label: `${i.toString().padStart(2, "0")}:00`,
  }));

  // Weekday options
  const weekdayOptions = [
    { value: "0", label: t("telegramAdmin.preferences.weekdays.sunday") },
    { value: "1", label: t("telegramAdmin.preferences.weekdays.monday") },
    { value: "2", label: t("telegramAdmin.preferences.weekdays.tuesday") },
    { value: "3", label: t("telegramAdmin.preferences.weekdays.wednesday") },
    { value: "4", label: t("telegramAdmin.preferences.weekdays.thursday") },
    { value: "5", label: t("telegramAdmin.preferences.weekdays.friday") },
    { value: "6", label: t("telegramAdmin.preferences.weekdays.saturday") },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* System Alerts */}
      <Section title={t("telegramAdmin.preferences.systemAlerts")}>
        <PreferenceItem
          icon={<Server className="size-4 text-destructive" />}
          iconBg="bg-destructive/10"
          label={t("telegramAdmin.preferences.nodeOffline")}
          description={t("telegramAdmin.preferences.nodeOfflineDesc")}
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
          label={t("telegramAdmin.preferences.agentOffline")}
          description={t("telegramAdmin.preferences.agentOfflineDesc")}
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

        {/* Offline settings - only show when node or agent offline is enabled */}
        {showOfflineSettings && (
          <>
            <PreferenceItem
              icon={<Clock className="size-4 text-muted-foreground" />}
              iconBg="bg-muted"
              label={t("telegramAdmin.preferences.offlineThreshold")}
              description={t("telegramAdmin.preferences.offlineThresholdDesc")}
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
                <span className="text-xs text-muted-foreground">
                  {t("telegramAdmin.preferences.minutes")}
                </span>
              </div>
            </PreferenceItem>

            <PreferenceItem
              icon={<Clock className="size-4 text-muted-foreground" />}
              iconBg="bg-muted"
              label={t("telegramAdmin.preferences.checkInterval")}
              description={t("telegramAdmin.preferences.checkIntervalDesc")}
            >
              <div className="flex items-center gap-1.5">
                <Controller
                  name="offlineCheckIntervalMinutes"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      className="w-14 h-7 text-center text-xs px-1"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 5)
                      }
                    />
                  )}
                />
                <span className="text-xs text-muted-foreground">
                  {t("telegramAdmin.preferences.minutes")}
                </span>
              </div>
            </PreferenceItem>
          </>
        )}
      </Section>

      {/* Business Events */}
      <Section title={t("telegramAdmin.preferences.businessEvents")}>
        <PreferenceItem
          icon={<UserPlus className="size-4 text-info" />}
          iconBg="bg-info/10"
          label={t("telegramAdmin.preferences.newUser")}
          description={t("telegramAdmin.preferences.newUserDesc")}
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
          label={t("telegramAdmin.preferences.paymentSuccess")}
          description={t("telegramAdmin.preferences.paymentSuccessDesc")}
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
      <Section title={t("telegramAdmin.preferences.reports")}>
        <PreferenceItem
          icon={<BarChart3 className="size-4 text-primary" />}
          iconBg="bg-primary/10"
          label={t("telegramAdmin.preferences.dailySummary")}
          description={t("telegramAdmin.preferences.dailySummaryDesc")}
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

        {/* Daily summary time - only show when enabled */}
        {notifyDailySummary && (
          <PreferenceItem
            icon={<Clock className="size-4 text-muted-foreground" />}
            iconBg="bg-muted"
            label={t("telegramAdmin.preferences.sendTime")}
            description={t("telegramAdmin.preferences.dailySendTimeDesc")}
          >
            <Controller
              name="dailySummaryHour"
              control={control}
              render={({ field }) => (
                <Select
                  value={(field.value ?? 0).toString()}
                  onValueChange={(v) => field.onChange(parseInt(v, 10))}
                >
                  <SelectTrigger className="w-20 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hourOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </PreferenceItem>
        )}

        <PreferenceItem
          icon={<Calendar className="size-4 text-primary" />}
          iconBg="bg-primary/10"
          label={t("telegramAdmin.preferences.weeklySummary")}
          description={t("telegramAdmin.preferences.weeklySummaryDesc")}
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

        {/* Weekly summary settings - only show when enabled */}
        {notifyWeeklySummary && (
          <>
            <PreferenceItem
              icon={<Calendar className="size-4 text-muted-foreground" />}
              iconBg="bg-muted"
              label={t("telegramAdmin.preferences.sendWeekday")}
              description={t("telegramAdmin.preferences.weeklySendWeekdayDesc")}
            >
              <Controller
                name="weeklySummaryWeekday"
                control={control}
                render={({ field }) => (
                  <Select
                    value={(field.value ?? 0).toString()}
                    onValueChange={(v) => field.onChange(parseInt(v, 10))}
                  >
                    <SelectTrigger className="w-16 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {weekdayOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </PreferenceItem>

            <PreferenceItem
              icon={<Clock className="size-4 text-muted-foreground" />}
              iconBg="bg-muted"
              label={t("telegramAdmin.preferences.sendTime")}
              description={t("telegramAdmin.preferences.weeklySendTimeDesc")}
            >
              <Controller
                name="weeklySummaryHour"
                control={control}
                render={({ field }) => (
                  <Select
                    value={(field.value ?? 0).toString()}
                    onValueChange={(v) => field.onChange(parseInt(v, 10))}
                  >
                    <SelectTrigger className="w-20 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hourOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </PreferenceItem>
          </>
        )}
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
            {t("telegramAdmin.preferences.saveChanges")}
          </Button>
        </div>
      )}
    </form>
  );
};
