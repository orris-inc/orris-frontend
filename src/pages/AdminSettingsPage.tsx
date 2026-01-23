/**
 * Admin Settings Page
 * System configuration page for administrators
 *
 * Layout: Horizontal tab navigation + Content panel (Tailwind Application UI style)
 */

import { AdminLayout } from '@/layouts/AdminLayout';
import { usePageTitle } from '@/shared/hooks';
import { Settings, KeyRound, Mail, MessageCircle, Wrench } from 'lucide-react';
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
  SystemSettingsForm,
  SystemSettingsFormSkeleton,
  OAuthSettingsForm,
  OAuthSettingsFormSkeleton,
  EmailSettingsForm,
  EmailSettingsFormSkeleton,
} from '@/features/settings';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';

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
  { id: 'oauth', labelKey: 'admin.settings.nav.oauth', icon: KeyRound },
  { id: 'email', labelKey: 'admin.settings.nav.email', icon: Mail },
  { id: 'telegram', labelKey: 'admin.settings.nav.telegram', icon: MessageCircle },
];

/**
 * Empty state component
 */
const EmptyState = ({ message }: { message: string }) => (
  <div className="bg-card rounded-lg ring-1 ring-border p-8 text-center text-muted-foreground">
    <Wrench className="size-8 mx-auto mb-2 opacity-50" />
    <p>{message}</p>
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

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-0">
        {/* Page Header */}
        <header className="shrink-0 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {t('admin.settings.title')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t('admin.settings.description')}
          </p>
        </header>

        {/* Tabs Navigation + Content */}
        <Tabs defaultValue="system" className="flex-1">
          {/* Tab List - Underline style */}
          <div className="border-b border-border mb-6">
            <TabsList className="h-auto p-0 bg-transparent rounded-none gap-0">
              {TAB_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <TabsTrigger
                    key={item.id}
                    value={item.id}
                    className="relative h-10 px-4 rounded-none bg-transparent shadow-none data-[state=active]:shadow-none data-[state=active]:bg-transparent text-muted-foreground data-[state=active]:text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-primary"
                  >
                    <Icon className="size-4 mr-2" />
                    <span className="hidden sm:inline">{t(item.labelKey)}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="pb-6">
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
            </div>
          </div>
        </Tabs>
      </div>
    </AdminLayout>
  );
};
