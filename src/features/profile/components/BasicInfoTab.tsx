import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Loader2 } from 'lucide-react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { useTranslation } from 'react-i18next';
import { useProfile } from '../hooks/useProfile';
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from '../types/profile.types';
import type { UserDisplayInfo } from '@/api/auth';

interface BasicInfoTabProps {
  user: UserDisplayInfo;
}

/**
 * Basic information tab with iOS 26 Liquid Glass style
 */
export const BasicInfoTab = ({ user }: BasicInfoTabProps) => {
  const { t } = useTranslation();
  const { updateProfile, isLoading } = useProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.displayName || '',
      email: user.email || '',
    },
  });

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      // Only send fields with values
      const payload: UpdateProfileFormData = {};
      if (data.name && data.name.trim()) {
        payload.name = data.name.trim();
      }
      if (data.email && data.email.trim() && data.email !== user.email) {
        payload.email = data.email.trim();
      }

      await updateProfile(payload);
    } catch {
      // Error already handled in useProfile
    }
  };

  // Input base styles with iOS 26 Liquid Glass effect
  const inputBaseStyles =
    'flex h-11 @sm:h-10 w-full rounded-xl border border-border/50 bg-background/80 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-target transition-all duration-200';

  return (
    <div className="py-2">
      {/* Basic information form */}
      <form onSubmit={handleSubmit(onSubmit)} className="@container grid gap-4 @sm:gap-6">
        {/* Username */}
        <div className="grid gap-2">
          <LabelPrimitive.Root
            htmlFor="name"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t('profile.basicInfo.username')}
          </LabelPrimitive.Root>
          <input
            id="name"
            className={inputBaseStyles}
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          <p className="text-xs @sm:text-sm text-muted-foreground">
            {errors.name?.message || t('profile.basicInfo.usernameHint')}
          </p>
        </div>

        {/* Email */}
        <div className="grid gap-2">
          <LabelPrimitive.Root
            htmlFor="email"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t('profile.basicInfo.email')}
          </LabelPrimitive.Root>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              className={`${inputBaseStyles} pl-10`}
              {...register('email')}
              aria-invalid={!!errors.email}
            />
          </div>
          <p className="text-xs @sm:text-sm text-muted-foreground">
            {errors.email?.message || t('profile.basicInfo.emailHint')}
          </p>
        </div>

        {/* Account status */}
        <div className="grid gap-2">
          <LabelPrimitive.Root className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {t('profile.basicInfo.accountStatus')}
          </LabelPrimitive.Root>
          <div>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 @sm:py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                user.status === 'active'
                  ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80'
                  : 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {t(`common.status.${user.status}`)}
            </span>
          </div>
        </div>

        {/* Email change reminder - iOS 26 Liquid Glass style */}
        {isDirty && (
          <div className="glass relative w-full rounded-xl p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground animate-spring-in">
            <Mail className="size-4" />
            <div className="text-xs @sm:text-sm [&_p]:leading-relaxed">
              {t('profile.basicInfo.emailChangeReminder')}
            </div>
          </div>
        )}

        {/* Save button - iOS 26 Liquid Glass interactive style */}
        <button
          type="submit"
          disabled={!isDirty || isLoading}
          className="glass-interactive inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 @sm:h-11 px-4 py-2 w-full touch-target"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('profile.basicInfo.saveChanges')}
        </button>
      </form>
    </div>
  );
};
