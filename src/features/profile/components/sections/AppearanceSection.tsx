/**
 * Appearance section component
 * Contains theme and language settings
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Select from '@radix-ui/react-select';
import { Sun, Moon, Monitor, Check, ChevronDown } from 'lucide-react';
import { cardTitleStyles, cardDescriptionStyles } from '@/lib/ui-styles';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n';

type ThemeValue = 'light' | 'dark' | 'system';

const themeOptions: { value: ThemeValue; labelKey: string; icon: React.ElementType }[] = [
  { value: 'light', labelKey: 'profile.appearance.themeLight', icon: Sun },
  { value: 'dark', labelKey: 'profile.appearance.themeDark', icon: Moon },
  { value: 'system', labelKey: 'profile.appearance.themeSystem', icon: Monitor },
];

export const AppearanceSection = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLanguage = (i18n.language || 'zh') as SupportedLanguage;

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang as SupportedLanguage);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Theme section */}
      <div className="rounded-xl bg-card ring-1 ring-border overflow-hidden">
        <div className="flex flex-col space-y-1.5 p-5 sm:p-6 border-b">
          <h3 className={`${cardTitleStyles} text-lg`}>
            {t('profile.appearance.theme')}
          </h3>
          <p className={`${cardDescriptionStyles} text-sm`}>
            {t('profile.appearance.themeDesc')}
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <RadioGroup.Root
            value={theme || 'system'}
            onValueChange={(value) => setTheme(value)}
            className="grid gap-3 sm:grid-cols-3"
          >
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              return (
                <RadioGroup.Item
                  key={option.value}
                  value={option.value}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 cursor-pointer transition-colors touch-target active:scale-[0.98] ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }`}
                >
                  <Icon className={`size-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {t(option.labelKey)}
                  </span>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="size-4 text-primary" />
                    </div>
                  )}
                </RadioGroup.Item>
              );
            })}
          </RadioGroup.Root>
        </div>
      </div>

      {/* Language section */}
      <div className="rounded-xl bg-card ring-1 ring-border overflow-hidden">
        <div className="flex flex-col space-y-1.5 p-5 sm:p-6 border-b">
          <h3 className={`${cardTitleStyles} text-lg`}>
            {t('common.language.label')}
          </h3>
          <p className={`${cardDescriptionStyles} text-sm`}>
            {t('profile.appearance.languageDesc')}
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <Select.Root value={currentLanguage} onValueChange={handleLanguageChange}>
            <Select.Trigger
              className="inline-flex items-center justify-between w-full sm:w-64 rounded-xl bg-background ring-1 ring-border px-4 py-3 text-sm font-medium hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-target active:scale-[0.98]"
              aria-label={t('common.language.label')}
            >
              <Select.Value>
                {SUPPORTED_LANGUAGES[currentLanguage]?.nativeName || currentLanguage}
              </Select.Value>
              <Select.Icon>
                <ChevronDown className="size-5 text-muted-foreground" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                className="overflow-hidden rounded-xl bg-popover ring-1 ring-border shadow-lg z-50 min-w-[200px] animate-in fade-in-0 zoom-in-95"
                position="popper"
                sideOffset={4}
              >
                <Select.Viewport className="p-1.5">
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
                    <Select.Item
                      key={code}
                      value={code}
                      className="relative flex items-center justify-between rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer select-none data-[highlighted]:bg-accent data-[state=checked]:bg-accent/50"
                    >
                      <Select.ItemText>{info.nativeName}</Select.ItemText>
                      <Select.ItemIndicator>
                        <Check className="size-4 text-primary" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      </div>
    </div>
  );
};
