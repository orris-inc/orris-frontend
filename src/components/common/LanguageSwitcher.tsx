/**
 * Language Switcher Component
 * A dropdown menu for switching between supported languages
 */

import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from './DropdownMenu';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n';

interface LanguageSwitcherProps {
  /** Additional class names for the trigger button */
  className?: string;
  /** Whether to show the language label */
  showLabel?: boolean;
  /** Button variant */
  variant?: 'ghost' | 'outline' | 'default';
  /** Button size */
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export function LanguageSwitcher({
  className,
  showLabel = false,
  variant = 'ghost',
  size = 'icon',
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language as SupportedLanguage;
  const currentLangInfo = SUPPORTED_LANGUAGES[currentLanguage] || SUPPORTED_LANGUAGES.zh;

  const handleLanguageChange = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('size-8 text-muted-foreground/60 hover:text-foreground hover:bg-muted/60', className)}
        >
          <Globe className="size-4" />
          {showLabel && (
            <span className="hidden sm:inline">{currentLangInfo.nativeName}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" className="min-w-[10rem]">
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => handleLanguageChange(code as SupportedLanguage)}
              className="flex items-center justify-between gap-2 cursor-pointer"
            >
              <span>{info.nativeName}</span>
              {currentLanguage === code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
