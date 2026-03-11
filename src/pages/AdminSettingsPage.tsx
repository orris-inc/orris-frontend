/**
 * Admin Settings Page
 * System configuration page with two-level navigation:
 * Level 1: Category cards (General, Security, Notifications, Billing)
 * Level 2: Sub-tabs (desktop) / Select dropdown (mobile)
 */

import { useState, useCallback, useMemo } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { usePageTitle } from '@/shared/hooks';
import {
  Settings,
  KeyRound,
  Mail,
  MessageCircle,
  Wrench,
  Coins,
  Rss,
  Palette,
  Shield,
  UserPlus,
  Scale,
  Bell,
  CreditCard,
  Fingerprint,
} from 'lucide-react';
import { useTelegramSettings } from '@/features/telegram/hooks/useTelegramSettings';
import {
  TelegramSettingsForm,
  TelegramSettingsFormSkeleton,
} from '@/features/telegram/components/TelegramSettingsForm';
import {
  useSystemSettings,
  useOAuthSettings,
  useEmailSettings,
  useUSDTSettings,
  useSubscriptionSettings,
  useBrandingSettings,
  useSecuritySettings,
  useRegistrationSettings,
  useAuthMethodsSettings,
  useLegalSettings,
  SystemSettingsForm,
  SystemSettingsFormSkeleton,
  OAuthSettingsForm,
  OAuthSettingsFormSkeleton,
  EmailSettingsForm,
  EmailSettingsFormSkeleton,
  USDTSettingsForm,
  USDTSettingsFormSkeleton,
  SubscriptionSettingsForm,
  SubscriptionSettingsFormSkeleton,
  BrandingSettingsForm,
  BrandingSettingsFormSkeleton,
  SecuritySettingsForm,
  SecuritySettingsFormSkeleton,
  RegistrationSettingsForm,
  RegistrationSettingsFormSkeleton,
  AuthMethodsSettingsForm,
  AuthMethodsSettingsFormSkeleton,
  LegalSettingsForm,
  LegalSettingsFormSkeleton,
} from '@/features/settings';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { cn } from '@/lib/utils';

/**
 * Settings item within a category
 */
interface SettingsItem {
  id: string;
  labelKey: string;
  icon: LucideIcon;
}

/**
 * Settings category grouping related items
 */
interface SettingsCategory {
  id: string;
  labelKey: string;
  descKey: string;
  icon: LucideIcon;
  items: SettingsItem[];
}

/**
 * Two-level navigation configuration:
 * 4 categories, each containing 2-3 settings items
 */
const CATEGORIES: SettingsCategory[] = [
  {
    id: 'general',
    labelKey: 'admin.settings.category.general',
    descKey: 'admin.settings.category.generalDesc',
    icon: Settings,
    items: [
      { id: 'system', labelKey: 'admin.settings.nav.system', icon: Settings },
      { id: 'branding', labelKey: 'admin.settings.nav.branding', icon: Palette },
      { id: 'legal', labelKey: 'admin.settings.nav.legal', icon: Scale },
    ],
  },
  {
    id: 'security',
    labelKey: 'admin.settings.category.security',
    descKey: 'admin.settings.category.securityDesc',
    icon: Shield,
    items: [
      { id: 'security', labelKey: 'admin.settings.nav.security', icon: Shield },
      { id: 'authMethods', labelKey: 'admin.settings.nav.authMethods', icon: Fingerprint },
      { id: 'registration', labelKey: 'admin.settings.nav.registration', icon: UserPlus },
      { id: 'oauth', labelKey: 'admin.settings.nav.oauth', icon: KeyRound },
    ],
  },
  {
    id: 'notifications',
    labelKey: 'admin.settings.category.notifications',
    descKey: 'admin.settings.category.notificationsDesc',
    icon: Bell,
    items: [
      { id: 'email', labelKey: 'admin.settings.nav.email', icon: Mail },
      { id: 'telegram', labelKey: 'admin.settings.nav.telegram', icon: MessageCircle },
    ],
  },
  {
    id: 'billing',
    labelKey: 'admin.settings.category.billing',
    descKey: 'admin.settings.category.billingDesc',
    icon: CreditCard,
    items: [
      { id: 'usdt', labelKey: 'admin.settings.nav.usdt', icon: Coins },
      { id: 'subscription', labelKey: 'admin.settings.nav.subscription', icon: Rss },
    ],
  },
];

/**
 * Empty state when settings cannot be loaded
 */
const EmptyState = ({ message }: { message: string }) => (
  <div className="bg-card rounded-lg ring-1 ring-border/60 p-6 text-center text-muted-foreground">
    <Wrench className="size-6 mx-auto mb-2 opacity-50" />
    <p className="text-[13px]">{message}</p>
  </div>
);

/**
 * Admin Settings Page Component
 */
export const AdminSettingsPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('admin.settings.title'));

  // Two-level navigation state
  const [activeCategoryId, setActiveCategoryId] = useState('general');
  const [activeItemId, setActiveItemId] = useState('system');

  const activeCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === activeCategoryId)!,
    [activeCategoryId],
  );

  const handleCategoryChange = useCallback((categoryId: string) => {
    setActiveCategoryId(categoryId);
    const category = CATEGORIES.find((c) => c.id === categoryId);
    if (category) setActiveItemId(category.items[0].id);
  }, []);

  // All settings hooks
  const {
    settings: systemSettings,
    isLoading: isSystemLoading,
    update: updateSystem,
    isUpdating: isSystemUpdating,
  } = useSystemSettings();

  const {
    settings: oauthSettings,
    isLoading: isOAuthLoading,
    update: updateOAuth,
    isUpdating: isOAuthUpdating,
  } = useOAuthSettings();

  const {
    settings: emailSettings,
    isLoading: isEmailLoading,
    update: updateEmail,
    isUpdating: isEmailUpdating,
    test: testEmail,
    isTesting: isEmailTesting,
    testResult: emailTestResult,
  } = useEmailSettings();

  const {
    config: telegramConfig,
    isLoading: isTelegramLoading,
    updateConfig: updateTelegram,
    isUpdating: isTelegramUpdating,
    testConnection: testTelegram,
    isTesting: isTelegramTesting,
    testResult: telegramTestResult,
  } = useTelegramSettings();

  const {
    settings: usdtSettings,
    isLoading: isUSDTLoading,
    update: updateUSDT,
    isUpdating: isUSDTUpdating,
  } = useUSDTSettings();

  const {
    settings: subscriptionSettings,
    isLoading: isSubscriptionLoading,
    update: updateSubscription,
    isUpdating: isSubscriptionUpdating,
  } = useSubscriptionSettings();

  const {
    settings: brandingSettings,
    isLoading: isBrandingLoading,
    update: updateBranding,
    isUpdating: isBrandingUpdating,
    upload: uploadBrandingImage,
    isUploading: isBrandingUploading,
  } = useBrandingSettings();

  const {
    settings: securitySettings,
    isLoading: isSecurityLoading,
    update: updateSecurity,
    isUpdating: isSecurityUpdating,
  } = useSecuritySettings();

  const {
    settings: authMethodsSettings,
    isLoading: isAuthMethodsLoading,
    update: updateAuthMethods,
    isUpdating: isAuthMethodsUpdating,
  } = useAuthMethodsSettings();

  const {
    settings: registrationSettings,
    isLoading: isRegistrationLoading,
    update: updateRegistration,
    isUpdating: isRegistrationUpdating,
  } = useRegistrationSettings();

  const {
    settings: legalSettings,
    isLoading: isLegalLoading,
    update: updateLegal,
    isUpdating: isLegalUpdating,
  } = useLegalSettings();

  // Render the active settings form
  const renderContent = () => {
    switch (activeItemId) {
      case 'system':
        return isSystemLoading ? (
          <SystemSettingsFormSkeleton />
        ) : !systemSettings ? (
          <EmptyState message={t('admin.settings.unableToLoadConfig')} />
        ) : (
          <SystemSettingsForm
            settings={systemSettings}
            onSubmit={updateSystem}
            isSubmitting={isSystemUpdating}
          />
        );

      case 'branding':
        return isBrandingLoading ? (
          <BrandingSettingsFormSkeleton />
        ) : !brandingSettings ? (
          <EmptyState message={t('admin.settings.unableToLoadConfig')} />
        ) : (
          <BrandingSettingsForm
            settings={brandingSettings}
            onSubmit={updateBranding}
            onUpload={uploadBrandingImage}
            isSubmitting={isBrandingUpdating}
            isUploading={isBrandingUploading}
          />
        );

      case 'legal':
        return isLegalLoading ? (
          <LegalSettingsFormSkeleton />
        ) : !legalSettings ? (
          <EmptyState message={t('admin.settings.unableToLoadConfig')} />
        ) : (
          <LegalSettingsForm
            settings={legalSettings}
            onSubmit={updateLegal}
            isSubmitting={isLegalUpdating}
          />
        );

      case 'security':
        return isSecurityLoading ? (
          <SecuritySettingsFormSkeleton />
        ) : !securitySettings ? (
          <EmptyState message={t('admin.settings.unableToLoadConfig')} />
        ) : (
          <SecuritySettingsForm
            settings={securitySettings}
            onSubmit={updateSecurity}
            isSubmitting={isSecurityUpdating}
          />
        );

      case 'authMethods':
        return isAuthMethodsLoading ? (
          <AuthMethodsSettingsFormSkeleton />
        ) : !authMethodsSettings ? (
          <EmptyState message={t('admin.settings.unableToLoadConfig')} />
        ) : (
          <AuthMethodsSettingsForm
            settings={authMethodsSettings}
            onSubmit={updateAuthMethods}
            isSubmitting={isAuthMethodsUpdating}
          />
        );

      case 'registration':
        return isRegistrationLoading ? (
          <RegistrationSettingsFormSkeleton />
        ) : !registrationSettings ? (
          <EmptyState message={t('admin.settings.unableToLoadConfig')} />
        ) : (
          <RegistrationSettingsForm
            settings={registrationSettings}
            onSubmit={updateRegistration}
            isSubmitting={isRegistrationUpdating}
          />
        );

      case 'oauth':
        return isOAuthLoading ? (
          <OAuthSettingsFormSkeleton />
        ) : !oauthSettings ? (
          <EmptyState message={t('admin.settings.unableToLoadConfig')} />
        ) : (
          <OAuthSettingsForm
            settings={oauthSettings}
            onSubmit={updateOAuth}
            isSubmitting={isOAuthUpdating}
          />
        );

      case 'email':
        return isEmailLoading ? (
          <EmailSettingsFormSkeleton />
        ) : !emailSettings ? (
          <EmptyState message={t('admin.settings.unableToLoadConfig')} />
        ) : (
          <EmailSettingsForm
            settings={emailSettings}
            onSubmit={updateEmail}
            onTest={testEmail}
            isSubmitting={isEmailUpdating}
            isTesting={isEmailTesting}
            testResult={emailTestResult}
          />
        );

      case 'telegram':
        return isTelegramLoading ? (
          <TelegramSettingsFormSkeleton />
        ) : !telegramConfig ? (
          <EmptyState message={t('admin.settings.unableToLoadConfig')} />
        ) : (
          <TelegramSettingsForm
            config={telegramConfig}
            onSubmit={updateTelegram}
            onTestConnection={testTelegram}
            isSubmitting={isTelegramUpdating}
            isTesting={isTelegramTesting}
            testResult={telegramTestResult}
          />
        );

      case 'usdt':
        return isUSDTLoading ? (
          <USDTSettingsFormSkeleton />
        ) : !usdtSettings ? (
          <EmptyState message={t('admin.settings.unableToLoadConfig')} />
        ) : (
          <USDTSettingsForm
            settings={usdtSettings}
            onSubmit={updateUSDT}
            isSubmitting={isUSDTUpdating}
          />
        );

      case 'subscription':
        return isSubscriptionLoading ? (
          <SubscriptionSettingsFormSkeleton />
        ) : !subscriptionSettings ? (
          <EmptyState message={t('admin.settings.unableToLoadConfig')} />
        ) : (
          <SubscriptionSettingsForm
            settings={subscriptionSettings}
            onSubmit={updateSubscription}
            isSubmitting={isSubscriptionUpdating}
          />
        );

      default:
        return <EmptyState message={t('admin.settings.unableToLoadConfig')} />;
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-0 space-y-4">
        {/* Level 1: Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = category.id === activeCategoryId;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryChange(category.id)}
                className={cn(
                  'group flex flex-col items-center gap-1.5 p-2.5',
                  'sm:flex-row sm:items-start sm:gap-2.5 sm:p-3',
                  'rounded-lg transition-all',
                  'touch-target',
                  isActive
                    ? 'bg-primary/10 ring-1 ring-primary/30 text-foreground'
                    : 'bg-card ring-1 ring-border/60 text-muted-foreground hover:ring-border hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-lg shrink-0',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted/50 text-muted-foreground group-hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="text-center sm:text-left min-w-0">
                  <div
                    className={cn(
                      'text-xs font-medium',
                      isActive && 'text-foreground',
                    )}
                  >
                    {t(category.labelKey)}
                  </div>
                  <div className="hidden md:block text-xs text-muted-foreground mt-0.5 truncate">
                    {t(category.descKey)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Level 2: Sub-navigation + Content */}
        <div>
          {/* Desktop: Underline sub-tabs */}
          <div className="hidden md:block border-b border-border/60 mb-6">
            <nav className="flex gap-1" aria-label="Settings sub-navigation">
              {activeCategory.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === activeItemId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveItemId(item.id)}
                    className={cn(
                      'relative flex items-center gap-1.5 px-3 h-9 text-[13px] font-medium',
                      'transition-colors',
                      'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:transition-colors',
                      isActive
                        ? 'text-foreground after:bg-primary'
                        : 'text-muted-foreground hover:text-foreground after:bg-transparent',
                    )}
                  >
                    <Icon className="size-3.5" />
                    {t(item.labelKey)}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile: Select dropdown */}
          <div className="md:hidden mb-4">
            <Select value={activeItemId} onValueChange={setActiveItemId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeCategory.items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {t(item.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content area */}
          <div className="max-w-3xl pb-4 md:pb-6">{renderContent()}</div>
        </div>
      </div>
    </AdminLayout>
  );
};
