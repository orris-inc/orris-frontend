/**
 * Admin Settings Page
 * System configuration page for administrators
 *
 * Layout: Horizontal tab navigation + Content panel (Tailwind Application UI style)
 * Mobile-first responsive design with icon-only tabs on mobile
 */

import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/admin';
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
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/Tabs';
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
  LegalSettingsForm,
  LegalSettingsFormSkeleton,
} from '@/features/settings';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/Tooltip';

/**
 * Tab item configuration
 */
interface TabItem {
  id: string;
  labelKey: string;
  icon: LucideIcon;
}

/**
 * Tab items configuration
 */
const TAB_ITEMS: TabItem[] = [
  { id: 'system', labelKey: 'admin.settings.nav.system', icon: Settings },
  { id: 'branding', labelKey: 'admin.settings.nav.branding', icon: Palette },
  { id: 'security', labelKey: 'admin.settings.nav.security', icon: Shield },
  { id: 'registration', labelKey: 'admin.settings.nav.registration', icon: UserPlus },
  { id: 'oauth', labelKey: 'admin.settings.nav.oauth', icon: KeyRound },
  { id: 'email', labelKey: 'admin.settings.nav.email', icon: Mail },
  { id: 'telegram', labelKey: 'admin.settings.nav.telegram', icon: MessageCircle },
  { id: 'usdt', labelKey: 'admin.settings.nav.usdt', icon: Coins },
  { id: 'subscription', labelKey: 'admin.settings.nav.subscription', icon: Rss },
  { id: 'legal', labelKey: 'admin.settings.nav.legal', icon: Scale },
];

/**
 * Empty state component with mobile-optimized padding
 */
const EmptyState = ({ message }: { message: string }) => (
  <div className="bg-card rounded-lg ring-1 ring-border p-6 md:p-8 text-center text-muted-foreground">
    <Wrench className="size-8 mx-auto mb-2 opacity-50" />
    <p className="text-sm md:text-base">{message}</p>
  </div>
);

/**
 * Admin Settings Page Component
 */
export const AdminSettingsPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('admin.settings.title'));

  // System settings
  const {
    settings: systemSettings,
    isLoading: isSystemLoading,
    update: updateSystem,
    isUpdating: isSystemUpdating,
  } = useSystemSettings();

  // OAuth settings
  const {
    settings: oauthSettings,
    isLoading: isOAuthLoading,
    update: updateOAuth,
    isUpdating: isOAuthUpdating,
  } = useOAuthSettings();

  // Email settings
  const {
    settings: emailSettings,
    isLoading: isEmailLoading,
    update: updateEmail,
    isUpdating: isEmailUpdating,
    test: testEmail,
    isTesting: isEmailTesting,
    testResult: emailTestResult,
  } = useEmailSettings();

  // Telegram settings
  const {
    config: telegramConfig,
    isLoading: isTelegramLoading,
    updateConfig: updateTelegram,
    isUpdating: isTelegramUpdating,
    testConnection: testTelegram,
    isTesting: isTelegramTesting,
    testResult: telegramTestResult,
  } = useTelegramSettings();

  // USDT settings
  const {
    settings: usdtSettings,
    isLoading: isUSDTLoading,
    update: updateUSDT,
    isUpdating: isUSDTUpdating,
  } = useUSDTSettings();

  // Subscription settings
  const {
    settings: subscriptionSettings,
    isLoading: isSubscriptionLoading,
    update: updateSubscription,
    isUpdating: isSubscriptionUpdating,
  } = useSubscriptionSettings();

  // Branding settings
  const {
    settings: brandingSettings,
    isLoading: isBrandingLoading,
    update: updateBranding,
    isUpdating: isBrandingUpdating,
    upload: uploadBrandingImage,
    isUploading: isBrandingUploading,
  } = useBrandingSettings();

  // Security settings
  const {
    settings: securitySettings,
    isLoading: isSecurityLoading,
    update: updateSecurity,
    isUpdating: isSecurityUpdating,
  } = useSecuritySettings();

  // Registration settings
  const {
    settings: registrationSettings,
    isLoading: isRegistrationLoading,
    update: updateRegistration,
    isUpdating: isRegistrationUpdating,
  } = useRegistrationSettings();

  // Legal settings
  const {
    settings: legalSettings,
    isLoading: isLegalLoading,
    update: updateLegal,
    isUpdating: isLegalUpdating,
  } = useLegalSettings();

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-0 space-y-6">
        {/* Page Header - Using PageHeader component */}
        <PageHeader
          title={t('admin.settings.title')}
          description={t('admin.settings.description')}
          icon={Settings}
        />

        {/* Tabs Navigation + Content */}
        <Tabs defaultValue="system" className="flex-1">
          {/* Tab List - Underline style, icon-only on mobile with tooltip */}
          <div className="border-b border-border mb-4 md:mb-6">
            <TooltipProvider delayDuration={300}>
              <TabsList className="h-auto p-0 bg-transparent rounded-none gap-0 w-full md:w-auto justify-start">
                {TAB_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const label = t(item.labelKey);
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <TabsTrigger
                          value={item.id}
                          className="relative min-h-11 md:h-10 px-3 md:px-4 rounded-none bg-transparent shadow-none data-[state=active]:shadow-none data-[state=active]:bg-transparent text-muted-foreground data-[state=active]:text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-primary touch-target"
                        >
                          <Icon className="size-5 md:size-4 md:mr-2" />
                          <span className="hidden md:inline">{label}</span>
                        </TabsTrigger>
                      </TooltipTrigger>
                      {/* Only show tooltip on mobile (md:hidden via CSS) */}
                      <TooltipContent className="md:hidden">
                        {label}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TabsList>
            </TooltipProvider>
          </div>

          {/* Tab Content - Mobile-optimized spacing */}
          <div className="pb-4 md:pb-6">
            <div className="max-w-3xl">
              {/* System Settings */}
              <TabsContent value="system">
                {isSystemLoading ? (
                  <SystemSettingsFormSkeleton />
                ) : !systemSettings ? (
                  <EmptyState message={t('admin.settings.unableToLoadConfig')} />
                ) : (
                  <SystemSettingsForm
                    settings={systemSettings}
                    onSubmit={updateSystem}
                    isSubmitting={isSystemUpdating}
                  />
                )}
              </TabsContent>

              {/* OAuth Settings */}
              <TabsContent value="oauth">
                {isOAuthLoading ? (
                  <OAuthSettingsFormSkeleton />
                ) : !oauthSettings ? (
                  <EmptyState message={t('admin.settings.unableToLoadConfig')} />
                ) : (
                  <OAuthSettingsForm
                    settings={oauthSettings}
                    onSubmit={updateOAuth}
                    isSubmitting={isOAuthUpdating}
                  />
                )}
              </TabsContent>

              {/* Email Settings */}
              <TabsContent value="email">
                {isEmailLoading ? (
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
                )}
              </TabsContent>

              {/* Telegram Settings */}
              <TabsContent value="telegram">
                {isTelegramLoading ? (
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
                )}
              </TabsContent>

              {/* USDT Settings */}
              <TabsContent value="usdt">
                {isUSDTLoading ? (
                  <USDTSettingsFormSkeleton />
                ) : !usdtSettings ? (
                  <EmptyState message={t('admin.settings.unableToLoadConfig')} />
                ) : (
                  <USDTSettingsForm
                    settings={usdtSettings}
                    onSubmit={updateUSDT}
                    isSubmitting={isUSDTUpdating}
                  />
                )}
              </TabsContent>

              {/* Subscription Settings */}
              <TabsContent value="subscription">
                {isSubscriptionLoading ? (
                  <SubscriptionSettingsFormSkeleton />
                ) : !subscriptionSettings ? (
                  <EmptyState message={t('admin.settings.unableToLoadConfig')} />
                ) : (
                  <SubscriptionSettingsForm
                    settings={subscriptionSettings}
                    onSubmit={updateSubscription}
                    isSubmitting={isSubscriptionUpdating}
                  />
                )}
              </TabsContent>

              {/* Branding Settings */}
              <TabsContent value="branding">
                {isBrandingLoading ? (
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
                )}
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security">
                {isSecurityLoading ? (
                  <SecuritySettingsFormSkeleton />
                ) : !securitySettings ? (
                  <EmptyState message={t('admin.settings.unableToLoadConfig')} />
                ) : (
                  <SecuritySettingsForm
                    settings={securitySettings}
                    onSubmit={updateSecurity}
                    isSubmitting={isSecurityUpdating}
                  />
                )}
              </TabsContent>

              {/* Registration Settings */}
              <TabsContent value="registration">
                {isRegistrationLoading ? (
                  <RegistrationSettingsFormSkeleton />
                ) : !registrationSettings ? (
                  <EmptyState message={t('admin.settings.unableToLoadConfig')} />
                ) : (
                  <RegistrationSettingsForm
                    settings={registrationSettings}
                    onSubmit={updateRegistration}
                    isSubmitting={isRegistrationUpdating}
                  />
                )}
              </TabsContent>

              {/* Legal Settings */}
              <TabsContent value="legal">
                {isLegalLoading ? (
                  <LegalSettingsFormSkeleton />
                ) : !legalSettings ? (
                  <EmptyState message={t('admin.settings.unableToLoadConfig')} />
                ) : (
                  <LegalSettingsForm
                    settings={legalSettings}
                    onSubmit={updateLegal}
                    isSubmitting={isLegalUpdating}
                  />
                )}
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </AdminLayout>
  );
};
