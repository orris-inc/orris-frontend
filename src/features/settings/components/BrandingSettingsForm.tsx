/**
 * Branding Settings Form
 * Form for configuring app branding (name, logo, favicon)
 */

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Skeleton } from '@/components/common/Skeleton';
import { FormSection, FormField, FormActions } from './FormField';
import { SourceBadge } from './SourceBadge';
import { cn } from '@/lib/utils';
import { cardStyles } from '@/lib/ui-styles';
import { baseURL } from '@/shared/lib/axios';
import type {
  BrandingSettingsResponse,
  UpdateBrandingSettingsRequest,
  BrandingUploadResponse,
} from '@/api/setting';

/**
 * Resolve asset URL to full path for display
 */
function resolveAssetUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) {
    if (baseURL.startsWith('http://') || baseURL.startsWith('https://')) {
      try {
        const apiUrl = new URL(baseURL);
        return `${apiUrl.origin}${url}`;
      } catch {
        return url;
      }
    }
    // Use /api proxy for uploads
    return `${baseURL}${url}`;
  }
  return url;
}

const brandingSettingsSchema = z.object({
  appName: z.string().max(50).optional(),
  logoUrl: z.string().max(500).optional(),
  faviconUrl: z.string().max(500).optional(),
});

type BrandingSettingsFormData = z.infer<typeof brandingSettingsSchema>;

interface BrandingSettingsFormProps {
  settings: BrandingSettingsResponse;
  onSubmit: (data: UpdateBrandingSettingsRequest) => Promise<void>;
  onUpload: (file: File) => Promise<BrandingUploadResponse>;
  isSubmitting: boolean;
  isUploading: boolean;
}

/**
 * Image upload component with preview
 */
const ImageUploader = ({
  label,
  currentUrl,
  onUpload,
  onClear,
  isUploading,
  accept,
}: {
  label: string;
  currentUrl: string;
  onUpload: (file: File) => void;
  onClear: () => void;
  isUploading: boolean;
  accept: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset input for re-selection
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Preview */}
      {currentUrl && (
        <div className="relative size-12 rounded-lg bg-muted ring-1 ring-border overflow-hidden">
          <img
            src={resolveAssetUrl(currentUrl)}
            alt={label}
            className="size-full object-contain"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute -top-1 -right-1 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* Upload button */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {label}
        </Button>
      </div>
    </div>
  );
};

/**
 * Branding settings form component
 *
 * Uses react-hook-form to manage all form state including image URLs.
 * This avoids useState/useEffect issues with React Compiler rules.
 */
export const BrandingSettingsForm = ({
  settings,
  onSubmit,
  onUpload,
  isSubmitting,
  isUploading,
}: BrandingSettingsFormProps) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<BrandingSettingsFormData>({
    resolver: zodResolver(brandingSettingsSchema),
    defaultValues: {
      appName: settings.appName.value as string,
      logoUrl: settings.logoUrl.value as string,
      faviconUrl: settings.faviconUrl.value as string,
    },
  });

  // Watch image URL values from form state
  const logoUrl = watch('logoUrl') || '';
  const faviconUrl = watch('faviconUrl') || '';

  // Sync form with API values only when the user has no unsaved edits.
  // After a successful save, handleFormSubmit calls reset() to clear isDirty,
  // so this effect will pick up the refreshed settings from the next query refetch.
  useEffect(() => {
    if (!isDirty) {
      reset({
        appName: settings.appName.value as string,
        logoUrl: settings.logoUrl.value as string,
        faviconUrl: settings.faviconUrl.value as string,
      });
    }
  }, [settings, reset, isDirty]);

  const handleFormSubmit = async (data: BrandingSettingsFormData) => {
    const updates: UpdateBrandingSettingsRequest = {};

    if (data.appName !== settings.appName.value) {
      updates.appName = data.appName;
    }
    if (logoUrl !== settings.logoUrl.value) {
      updates.logoUrl = logoUrl;
    }
    if (faviconUrl !== settings.faviconUrl.value) {
      updates.faviconUrl = faviconUrl;
    }

    if (Object.keys(updates).length > 0) {
      await onSubmit(updates);
      // Clear isDirty so the useEffect can sync with refreshed API values
      reset(data);
    }
  };

  const handleLogoUpload = async (file: File) => {
    const result = await onUpload(file);
    setValue('logoUrl', result.url, { shouldDirty: true });
  };

  const handleFaviconUpload = async (file: File) => {
    const result = await onUpload(file);
    setValue('faviconUrl', result.url, { shouldDirty: true });
  };

  const hasChanges = isDirty;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormSection
        title={t('admin.settings.branding.title')}
        description={t('admin.settings.branding.description')}
      >
        {/* App Name */}
        <FormField
          label={t('admin.settings.branding.appName')}
          description={t('admin.settings.branding.appNameDesc')}
          labelRight={<SourceBadge source={settings.appName.source} />}
        >
          <Input
            {...register('appName')}
            placeholder={t('admin.settings.branding.appNamePlaceholder')}
            className="max-w-md"
          />
          {errors.appName && (
            <p className="text-sm text-destructive mt-1">{errors.appName.message}</p>
          )}
        </FormField>

        {/* Logo */}
        <FormField
          label={t('admin.settings.branding.logo')}
          description={t('admin.settings.branding.logoDesc')}
          labelRight={<SourceBadge source={settings.logoUrl.source} />}
        >
          <ImageUploader
            label={t('admin.settings.branding.uploadLogo')}
            currentUrl={logoUrl}
            onUpload={handleLogoUpload}
            onClear={() => setValue('logoUrl', '', { shouldDirty: true })}
            isUploading={isUploading}
            accept="image/png,image/jpeg,image/svg+xml"
          />
        </FormField>

        {/* Favicon */}
        <FormField
          label={t('admin.settings.branding.favicon')}
          description={t('admin.settings.branding.faviconDesc')}
          labelRight={<SourceBadge source={settings.faviconUrl.source} />}
        >
          <ImageUploader
            label={t('admin.settings.branding.uploadFavicon')}
            currentUrl={faviconUrl}
            onUpload={handleFaviconUpload}
            onClear={() => setValue('faviconUrl', '', { shouldDirty: true })}
            isUploading={isUploading}
            accept="image/png,image/x-icon,image/svg+xml"
          />
        </FormField>

        {/* Save Button */}
        {hasChanges && (
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
export const BrandingSettingsFormSkeleton = () => (
  <div className={cn(cardStyles, 'overflow-hidden')}>
    {/* Header skeleton */}
    <div className="flex items-center justify-between p-4 pb-3 border-b border-border/60">
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3.5 w-48" />
      </div>
    </div>
    {/* Fields skeleton */}
    <div className="divide-y divide-border/60">
      {/* App name field */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-4">
        <div className="sm:pt-2 space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="sm:col-span-2">
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
      </div>
      {/* Logo field */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-4">
        <div className="sm:pt-2 space-y-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="sm:col-span-2 flex items-center gap-4">
          <Skeleton className="size-12 rounded-lg" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      {/* Favicon field */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-4">
        <div className="sm:pt-2 space-y-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-44" />
        </div>
        <div className="sm:col-span-2 flex items-center gap-4">
          <Skeleton className="size-12 rounded-lg" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  </div>
);
