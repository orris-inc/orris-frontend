/**
 * Notifications section component
 * Contains email and push notification preferences
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Switch from '@radix-ui/react-switch';
import { Info } from 'lucide-react';
import { cardTitleStyles, cardDescriptionStyles, alertDescriptionStyles } from '@/lib/ui-styles';

interface NotificationToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const NotificationToggle = ({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: NotificationToggleProps) => (
  <div className="flex items-center justify-between py-3">
    <div className="space-y-0.5 pr-4">
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <Switch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
    >
      <Switch.Thumb className="pointer-events-none block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
    </Switch.Root>
  </div>
);

export const NotificationsSection = () => {
  const { t } = useTranslation();

  // Local state for notification preferences
  // In production, this would be fetched from and synced with the backend
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Email notifications section */}
      <div className="rounded-xl bg-card ring-1 ring-border overflow-hidden">
        <div className="flex flex-col space-y-1.5 p-5 sm:p-6 border-b">
          <h3 className={`${cardTitleStyles} text-lg`}>
            {t('profile.notifications.emailNotifications')}
          </h3>
          <p className={`${cardDescriptionStyles} text-sm`}>
            {t('profile.notifications.emailNotificationsDesc')}
          </p>
        </div>
        <div className="p-5 sm:p-6 divide-y divide-border">
          <NotificationToggle
            id="marketingEmails"
            label={t('profile.notifications.marketingEmails')}
            description={t('profile.notifications.marketingEmailsDesc')}
            checked={marketingEmails}
            onCheckedChange={setMarketingEmails}
          />
          <NotificationToggle
            id="securityAlerts"
            label={t('profile.notifications.securityAlerts')}
            description={t('profile.notifications.securityAlertsDesc')}
            checked={securityAlerts}
            onCheckedChange={setSecurityAlerts}
          />
          <NotificationToggle
            id="productUpdates"
            label={t('profile.notifications.productUpdates')}
            description={t('profile.notifications.productUpdatesDesc')}
            checked={productUpdates}
            onCheckedChange={setProductUpdates}
          />
        </div>
      </div>

      {/* Push notifications section */}
      <div className="rounded-xl bg-card ring-1 ring-border overflow-hidden">
        <div className="flex flex-col space-y-1.5 p-5 sm:p-6 border-b">
          <h3 className={`${cardTitleStyles} text-lg`}>
            {t('profile.notifications.pushNotifications')}
          </h3>
          <p className={`${cardDescriptionStyles} text-sm`}>
            {t('profile.notifications.pushNotificationsDesc')}
          </p>
        </div>
        <div className="p-5 sm:p-6">
          {/* Coming soon notice */}
          <div className="relative w-full rounded-xl bg-muted/50 ring-1 ring-border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-muted-foreground">
            <Info className="size-4" />
            <div className={`${alertDescriptionStyles} text-sm`}>
              {t('profile.notifications.comingSoon')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
