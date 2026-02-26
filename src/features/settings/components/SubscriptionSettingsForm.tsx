/**
 * Subscription Settings Form
 * Form for configuring subscription display settings
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';
import { cardStyles } from '@/lib/ui-styles';
import { FormSection, FormField, FormActions } from './FormField';
import { SourceBadge } from './SourceBadge';
import type {
  SubscriptionSettingsResponse,
  UpdateSubscriptionSettingsRequest,
} from '@/api/setting';

const subscriptionSettingsSchema = z.object({
  showInfoNodes: z.boolean(),
});

type SubscriptionSettingsFormData = z.infer<typeof subscriptionSettingsSchema>;

interface SubscriptionSettingsFormProps {
  settings: SubscriptionSettingsResponse;
  onSubmit: (data: UpdateSubscriptionSettingsRequest) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Subscription settings form component
 */
export const SubscriptionSettingsForm = ({
  settings,
  onSubmit,
  isSubmitting,
}: SubscriptionSettingsFormProps) => {
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<SubscriptionSettingsFormData>({
    resolver: zodResolver(subscriptionSettingsSchema),
    defaultValues: {
      showInfoNodes: settings.showInfoNodes.value as boolean,
    },
  });

  // Sync form with API values only when the user has no unsaved edits.
  // After a successful save, handleFormSubmit calls reset() to clear isDirty,
  // so this effect will pick up the refreshed settings from the next query refetch.
  useEffect(() => {
    if (!isDirty) {
      reset({
        showInfoNodes: settings.showInfoNodes.value as boolean,
      });
    }
  }, [settings, reset, isDirty]);

  const handleFormSubmit = async (data: SubscriptionSettingsFormData) => {
    const updates: UpdateSubscriptionSettingsRequest = {};

    if (data.showInfoNodes !== settings.showInfoNodes.value) {
      updates.showInfoNodes = data.showInfoNodes;
    }

    if (Object.keys(updates).length > 0) {
      await onSubmit(updates);
      // Clear isDirty so the useEffect can sync with refreshed API values
      reset(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormSection
        title={t('admin.settings.subscription.title')}
        description={t('admin.settings.subscription.description')}
      >
        {/* Show Info Nodes */}
        <FormField
          label={t('admin.settings.subscription.showInfoNodes')}
          description={t('admin.settings.subscription.showInfoNodesDesc')}
          labelRight={<SourceBadge source={settings.showInfoNodes.source} />}
        >
          <Controller
            name="showInfoNodes"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange}>
                <SwitchThumb />
              </Switch>
            )}
          />
        </FormField>

        {/* Save Button */}
        {isDirty && (
          <FormActions>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {t('admin.settings.saveChanges')}
            </Button>
          </FormActions>
        )}
      </FormSection>
    </form>
  );
};

/**
 * Loading skeleton for the form
 */
export const SubscriptionSettingsFormSkeleton = () => (
  <div className={cn(cardStyles, 'overflow-hidden')}>
    {/* Header skeleton */}
    <div className="flex items-center justify-between p-5 pb-4 border-b border-border/50">
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3.5 w-52" />
      </div>
    </div>
    {/* Fields skeleton */}
    <div className="divide-y divide-border/50">
      {/* Switch field */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-5">
        <div className="sm:pt-2 space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="sm:col-span-2">
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);
