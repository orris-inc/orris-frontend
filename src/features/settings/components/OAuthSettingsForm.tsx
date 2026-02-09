/**
 * OAuth Settings Form
 * Form for configuring OAuth provider settings (Google, GitHub)
 * Uses accordion pattern for providers with FormField inside
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { FormSection, FormField, FormActions } from './FormField';
import { SecretInput } from './SecretInput';
import { cn } from '@/lib/utils';
import type {
  OAuthSettingsResponse,
  UpdateOAuthSettingsRequest,
  OAuthProviderSettings,
} from '@/api/admin';

// Icons for providers
const GoogleIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const GitHubIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const oauthProviderSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
});

const oauthSettingsSchema = z.object({
  google: oauthProviderSchema,
  github: oauthProviderSchema,
});

/**
 * Get redirect URL for OAuth provider
 * If backend returns example.com or empty, use current origin as fallback
 */
const getRedirectUrl = (backendValue: string | undefined, provider: string): string => {
  // If backend returned a valid non-example URL, use it
  if (backendValue && !backendValue.includes('example.com')) {
    return backendValue;
  }
  // Otherwise calculate from current origin
  return `${window.location.origin}/auth/${provider}/callback`;
};

type OAuthSettingsFormData = z.infer<typeof oauthSettingsSchema>;

interface OAuthSettingsFormProps {
  settings: OAuthSettingsResponse;
  onSubmit: (data: UpdateOAuthSettingsRequest) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Status badge component
 */
const StatusBadge = ({ enabled }: { enabled: boolean }) => {
  const { t } = useTranslation();

  return enabled ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success ring-1 ring-success/20">
      <CheckCircle2 className="size-3" />
      {t('common.status.enabled')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
      <XCircle className="size-3" />
      {t('common.status.disabled')}
    </span>
  );
};

interface ProviderSectionProps {
  name: 'google' | 'github';
  icon: React.ReactNode;
  label: string;
  settings: OAuthProviderSettings;
  control: ReturnType<typeof useForm<OAuthSettingsFormData>>['control'];
  isExpanded: boolean;
  onToggle: () => void;
}

const ProviderSection = ({
  name,
  icon,
  label,
  settings,
  control,
  isExpanded,
  onToggle,
}: ProviderSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="border-b border-border/50 last:border-b-0">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'text-foreground',
              name === 'google' && 'text-destructive'
            )}
          >
            {icon}
          </span>
          <div className="text-left">
            <div className="font-medium text-foreground">{label}</div>
            <div className="text-xs text-muted-foreground">
              {t(`admin.settings.oauth.${name}Desc`)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge enabled={settings.enabled} />
          {isExpanded ? (
            <ChevronUp className="size-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-border/50 divide-y divide-border/50">
          {/* Client ID */}
          <FormField
            label={t('admin.settings.oauth.clientId')}
            description={t('admin.settings.oauth.clientIdDesc')}
          >
            <Controller
              name={`${name}.clientId`}
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder={t('admin.settings.oauth.clientIdPlaceholder')}
                  className="font-mono text-sm"
                />
              )}
            />
          </FormField>

          {/* Client Secret */}
          <FormField
            label={t('admin.settings.oauth.clientSecret')}
            description={t('admin.settings.oauth.clientSecretDesc')}
          >
            <Controller
              name={`${name}.clientSecret`}
              control={control}
              render={({ field }) => (
                <SecretInput
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder={t('admin.settings.oauth.clientSecretPlaceholder')}
                />
              )}
            />
          </FormField>

          {/* Redirect URL - Read-only, calculated from frontend URL */}
          <FormField
            label={t('admin.settings.oauth.redirectUrl')}
            description={t('admin.settings.oauth.redirectUrlDesc')}
          >
            <Input
              type="url"
              value={getRedirectUrl(settings.redirectUrl.value as string, name)}
              disabled
              className="font-mono text-sm bg-muted/50"
            />
          </FormField>
        </div>
      )}
    </div>
  );
};

/**
 * OAuth settings form component
 */
export const OAuthSettingsForm = ({
  settings,
  onSubmit,
  isSubmitting,
}: OAuthSettingsFormProps) => {
  const { t } = useTranslation();
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(
    new Set()
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<OAuthSettingsFormData>({
    resolver: zodResolver(oauthSettingsSchema),
    defaultValues: {
      google: {
        clientId: (settings.google.clientId.value as string) || '',
        clientSecret: (settings.google.clientSecret.value as string) || '',
      },
      github: {
        clientId: (settings.github.clientId.value as string) || '',
        clientSecret: (settings.github.clientSecret.value as string) || '',
      },
    },
  });

  // Reset form when settings change
  useEffect(() => {
    reset({
      google: {
        clientId: (settings.google.clientId.value as string) || '',
        clientSecret: (settings.google.clientSecret.value as string) || '',
      },
      github: {
        clientId: (settings.github.clientId.value as string) || '',
        clientSecret: (settings.github.clientSecret.value as string) || '',
      },
    });
  }, [settings, reset]);

  const toggleProvider = (provider: string) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(provider)) {
        next.delete(provider);
      } else {
        next.add(provider);
      }
      return next;
    });
  };

  const handleFormSubmit = async (data: OAuthSettingsFormData) => {
    const updates: UpdateOAuthSettingsRequest = {};

    // Check Google changes
    const googleChanges: UpdateOAuthSettingsRequest['google'] = {};
    if (
      data.google.clientId &&
      !data.google.clientId.includes('*') &&
      data.google.clientId !== settings.google.clientId.value
    ) {
      googleChanges.clientId = data.google.clientId;
    }
    if (
      data.google.clientSecret &&
      !data.google.clientSecret.includes('*') &&
      data.google.clientSecret !== settings.google.clientSecret.value
    ) {
      googleChanges.clientSecret = data.google.clientSecret;
    }
    if (Object.keys(googleChanges).length > 0) {
      updates.google = googleChanges;
    }

    // Check GitHub changes
    const githubChanges: UpdateOAuthSettingsRequest['github'] = {};
    if (
      data.github.clientId &&
      !data.github.clientId.includes('*') &&
      data.github.clientId !== settings.github.clientId.value
    ) {
      githubChanges.clientId = data.github.clientId;
    }
    if (
      data.github.clientSecret &&
      !data.github.clientSecret.includes('*') &&
      data.github.clientSecret !== settings.github.clientSecret.value
    ) {
      githubChanges.clientSecret = data.github.clientSecret;
    }
    if (Object.keys(githubChanges).length > 0) {
      updates.github = githubChanges;
    }

    if (Object.keys(updates).length > 0) {
      await onSubmit(updates);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormSection
        title={t('admin.settings.oauth.title')}
        description={t('admin.settings.oauth.description')}
      >
        {/* Google */}
        <ProviderSection
          name="google"
          icon={<GoogleIcon />}
          label={t('admin.settings.oauth.google')}
          settings={settings.google}
          control={control}
          isExpanded={expandedProviders.has('google')}
          onToggle={() => toggleProvider('google')}
        />

        {/* GitHub */}
        <ProviderSection
          name="github"
          icon={<GitHubIcon />}
          label={t('admin.settings.oauth.github')}
          settings={settings.github}
          control={control}
          isExpanded={expandedProviders.has('github')}
          onToggle={() => toggleProvider('github')}
        />

        {/* Actions */}
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
export const OAuthSettingsFormSkeleton = () => (
  <div className="glass-elevated rounded-2xl overflow-hidden">
    {/* Header skeleton */}
    <div className="flex items-center justify-between p-5 pb-4 border-b border-border/50">
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3.5 w-48" />
      </div>
    </div>
    {/* Provider skeletons */}
    <div className="divide-y divide-border/50">
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-5 rounded" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="size-5" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
