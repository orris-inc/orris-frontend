/**
 * Admin Notification Preferences Form
 * Form for editing admin Telegram notification preferences
 *
 * Tailwind Application UI design pattern:
 * - Stacked list with dividers
 * - Toggle switches with labels and descriptions
 * - Grouped by notification category
 * - Mobile-first responsive design with proper touch targets
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
import { cn } from "@/lib/utils";

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

/**
 * Section component for grouping preferences
 */
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section = ({ title, children }: SectionProps) => (
  <div className="space-y-1">
    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
      {title}
    </h4>
    <div className="divide-y divide-border rounded-lg border border-border bg-background overflow-hidden">
      {children}
    </div>
  </div>
);

/**
 * Preference toggle item with icon, label, description and switch
 */
interface PreferenceToggleProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description?: string;
  children: React.ReactNode;
}

const PreferenceToggle = ({
  icon,
  iconBg,
  label,
  description,
  children,
}: PreferenceToggleProps) => (
  <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
    <div className="flex items-center gap-3 min-w-0">
      <div className={cn("shrink-0 p-2 rounded-lg", iconBg)}>{icon}</div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {description}
          </div>
        )}
      </div>
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

/**
 * Sub-setting item for threshold/interval configuration
 * Mobile-first: stacked layout on mobile, horizontal on sm+
 */
interface SubSettingProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  children: React.ReactNode;
}

const SubSetting = ({ icon, label, description, children }: SubSettingProps) => (
  <div className="p-3 sm:p-4 bg-muted/30">
    {/* Mobile: stacked layout, sm+: horizontal */}
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="shrink-0 p-1.5 rounded-md bg-background text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{label}</div>
          {description && (
            <div className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              {description}
            </div>
          )}
        </div>
      </div>
      {/* Mobile: full width control area aligned to left with indent */}
      <div className="pl-8 sm:pl-0 sm:shrink-0">{children}</div>
    </div>
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* System Alerts Section */}
      <Section title={t("telegramAdmin.preferences.systemAlerts")}>
        <PreferenceToggle
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
        </PreferenceToggle>

        <PreferenceToggle
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
        </PreferenceToggle>

        {/* Offline settings - only show when node or agent offline is enabled */}
        {showOfflineSettings && (
          <>
            <SubSetting
              icon={<Clock className="size-3.5" />}
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
                      className="w-16 sm:w-14 h-10 sm:h-8 text-center text-base sm:text-sm px-1"
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
            </SubSetting>

            <SubSetting
              icon={<Clock className="size-3.5" />}
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
                      className="w-16 sm:w-14 h-10 sm:h-8 text-center text-base sm:text-sm px-1"
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
            </SubSetting>
          </>
        )}
      </Section>

      {/* Business Events Section */}
      <Section title={t("telegramAdmin.preferences.businessEvents")}>
        <PreferenceToggle
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
        </PreferenceToggle>

        <PreferenceToggle
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
        </PreferenceToggle>
      </Section>

      {/* Reports Section */}
      <Section title={t("telegramAdmin.preferences.reports")}>
        <PreferenceToggle
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
        </PreferenceToggle>

        {/* Daily summary time - only show when enabled */}
        {notifyDailySummary && (
          <SubSetting
            icon={<Clock className="size-3.5" />}
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
                  <SelectTrigger className="min-w-[5.5rem] h-10 sm:h-8 text-base sm:text-sm">
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
          </SubSetting>
        )}

        <PreferenceToggle
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
        </PreferenceToggle>

        {/* Weekly summary settings - only show when enabled */}
        {notifyWeeklySummary && (
          <>
            <SubSetting
              icon={<Calendar className="size-3.5" />}
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
                    <SelectTrigger className="min-w-[5.5rem] h-10 sm:h-8 text-base sm:text-sm">
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
            </SubSetting>

            <SubSetting
              icon={<Clock className="size-3.5" />}
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
                    <SelectTrigger className="min-w-[5.5rem] h-10 sm:h-8 text-base sm:text-sm">
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
            </SubSetting>
          </>
        )}
      </Section>

      {/* Save button - Sticky on mobile for easy access */}
      {isDirty && (
        <div className="sticky bottom-4 sm:static">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-11"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("telegramAdmin.preferences.saveChanges")}
          </Button>
        </div>
      )}
    </form>
  );
};
