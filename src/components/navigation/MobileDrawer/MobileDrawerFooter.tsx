/**
 * Mobile Drawer Footer Component
 *
 * Compact footer with icon buttons for quick settings and actions.
 * Following mobile-first design: single row of icon buttons.
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import {
  LogOut,
  Shield,
  ArrowLeftRight,
  Moon,
  Sun,
  Languages,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/common/Tooltip';

import type { MobileDrawerFooterProps } from './types';

export const MobileDrawerFooter = ({
  showAdminSwitch = false,
  isAdminView = false,
  serverVersion,
  clientVersion,
  onAdminClick,
  onLogout,
  onClose,
}: MobileDrawerFooterProps) => {
  const { t, i18n } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  const toggleLanguage = useCallback(() => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  }, [i18n]);

  const handleAdminClick = useCallback(() => {
    onAdminClick?.();
    onClose();
  }, [onAdminClick, onClose]);

  const handleLogout = useCallback(() => {
    onLogout?.();
    onClose();
  }, [onLogout, onClose]);

  // Icon button base styles
  const iconButtonStyles = cn(
    'flex items-center justify-center',
    'size-10 rounded-lg',
    'text-muted-foreground',
    'hover:bg-background/80 hover:text-foreground',
    'active:bg-background',
    'transition-colors duration-150'
  );

  return (
    <div className="shrink-0 border-t border-border bg-muted/40">
      {/* Compact action bar - single row of icon buttons */}
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left: Quick settings */}
        <div className="flex items-center gap-1">
          {/* Language toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleLanguage}
                className={iconButtonStyles}
                aria-label={i18n.language === 'zh' ? 'Switch to English' : '切换到中文'}
              >
                <Languages className="size-5" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {i18n.language === 'zh' ? 'English' : '中文'}
            </TooltipContent>
          </Tooltip>

          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleTheme}
                className={iconButtonStyles}
                aria-label={isDark ? t('profile.appearance.themeLight') : t('profile.appearance.themeDark')}
              >
                {isDark ? (
                  <Sun className="size-5" aria-hidden="true" />
                ) : (
                  <Moon className="size-5" aria-hidden="true" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {isDark ? t('profile.appearance.themeLight') : t('profile.appearance.themeDark')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Admin/User switch */}
          {showAdminSwitch && onAdminClick && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleAdminClick}
                  className={cn(iconButtonStyles, 'text-primary hover:text-primary')}
                  aria-label={isAdminView ? t('nav.switchToUser') : t('nav.switchToAdmin')}
                >
                  {isAdminView ? (
                    <ArrowLeftRight className="size-5" aria-hidden="true" />
                  ) : (
                    <Shield className="size-5" aria-hidden="true" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isAdminView ? t('nav.switchToUser') : t('nav.switchToAdmin')}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Logout */}
          {onLogout && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={cn(iconButtonStyles, 'text-destructive hover:text-destructive')}
                  aria-label={t('nav.logout')}
                >
                  <LogOut className="size-5" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {t('nav.logout')}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Version info - minimal */}
      {(serverVersion || clientVersion) && (
        <div className="pb-2 text-center text-[10px] text-muted-foreground/60 font-mono">
          {[serverVersion, clientVersion].filter(Boolean).join(' / ')}
        </div>
      )}
    </div>
  );
};
