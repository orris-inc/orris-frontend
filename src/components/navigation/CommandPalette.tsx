/**
 * CommandPalette Component
 *
 * Global command search with keyboard navigation.
 * Features:
 * - ⌘K / Ctrl+K keyboard shortcut trigger
 * - Search navigation items + quick actions
 * - Arrow keys navigation + Enter to select
 * - Desktop: Dialog, Mobile: Bottom Sheet
 * - Respects reduced-motion preferences
 * - Recent items stored in localStorage
 * - Search text highlighting
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Bell,
  Settings,
  User,
  LayoutDashboard,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useMediaQuery } from '@/hooks';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/common/Dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from '@/components/common/sheet/Sheet';
import { inputStyles } from '@/lib/ui-styles';
import type { NavigationItem } from '@/types/navigation.types';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// Constants
// ============================================================================

const RECENT_ITEMS_KEY = 'command-palette-recent';
const MAX_RECENT_ITEMS = 3;

// ============================================================================
// Types
// ============================================================================

interface QuickAction {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navigationItems: NavigationItem[];
}

type CommandItem =
  | { type: 'navigation'; item: NavigationItem }
  | { type: 'action'; item: QuickAction };

// Type guards for CommandItem
function isActionItem(
  item: CommandItem
): item is { type: 'action'; item: QuickAction } {
  return item.type === 'action';
}

function isNavigationItem(
  item: CommandItem
): item is { type: 'navigation'; item: NavigationItem } {
  return item.type === 'navigation';
}

// ============================================================================
// HighlightedText Component
// ============================================================================

interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
}

/**
 * Highlights matching text in search results
 */
const HighlightedText = ({ text, query, className }: HighlightedTextProps) => {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = text.toLowerCase();
  const matchIndex = normalizedText.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return <span className={className}>{text}</span>;
  }

  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + query.length);
  const after = text.slice(matchIndex + query.length);

  return (
    <span className={className}>
      {before}
      <mark className="bg-primary/20 text-foreground rounded-sm px-0.5">
        {match}
      </mark>
      {after}
    </span>
  );
};

// ============================================================================
// Hook: useRecentItems
// ============================================================================

interface RecentItem {
  id: string;
  type: 'navigation' | 'action';
  timestamp: number;
}

// Runtime type guard for localStorage data integrity
function isValidRecentItem(item: unknown): item is RecentItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as Record<string, unknown>).id === 'string' &&
    ((item as Record<string, unknown>).type === 'navigation' ||
      (item as Record<string, unknown>).type === 'action') &&
    typeof (item as Record<string, unknown>).timestamp === 'number'
  );
}

/**
 * Manages recent items in localStorage
 */
function useRecentItems() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_ITEMS_KEY);
      if (!stored) return [];
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidRecentItem);
    } catch {
      return [];
    }
  });

  const addRecentItem = useCallback((id: string, type: 'navigation' | 'action') => {
    setRecentItems((prev) => {
      // Remove existing entry if present
      const filtered = prev.filter((item) => item.id !== id);
      // Add new entry at the beginning
      const updated = [
        { id, type, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT_ITEMS);

      // Persist to localStorage
      try {
        localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }

      return updated;
    });
  }, []);

  return { recentItems, addRecentItem };
}

// ============================================================================
// Component
// ============================================================================

export const CommandPalette = ({
  open,
  onOpenChange,
  navigationItems,
}: CommandPaletteProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 639px)');

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Recent items management
  const { recentItems, addRecentItem } = useRecentItems();

  // Quick actions
  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'announcements',
        labelKey: 'commandPalette.actions.viewAnnouncements',
        icon: Bell,
        action: () => {
          navigate('/admin/announcements');
          onOpenChange(false);
        },
      },
      {
        id: 'settings',
        labelKey: 'commandPalette.actions.systemSettings',
        icon: Settings,
        action: () => {
          navigate('/admin/settings');
          onOpenChange(false);
        },
      },
      {
        id: 'profile',
        labelKey: 'commandPalette.actions.myProfile',
        icon: User,
        action: () => {
          navigate('/admin/profile');
          onOpenChange(false);
        },
      },
    ],
    [navigate, onOpenChange]
  );

  // Filter and combine results
  const filteredItems = useMemo((): CommandItem[] => {
    const normalizedQuery = query.toLowerCase().trim();

    // Filter navigation items
    const navResults: CommandItem[] = navigationItems
      .filter((item) => {
        if (!normalizedQuery) return true;
        const label = t(item.labelKey).toLowerCase();
        return label.includes(normalizedQuery);
      })
      .map((item) => ({ type: 'navigation' as const, item }));

    // Filter quick actions
    const actionResults: CommandItem[] = quickActions
      .filter((action) => {
        if (!normalizedQuery) return true;
        const label = t(action.labelKey).toLowerCase();
        return label.includes(normalizedQuery);
      })
      .map((item) => ({ type: 'action' as const, item }));

    return [...actionResults, ...navResults];
  }, [query, navigationItems, quickActions, t]);

  // Get recent command items (only when no search query)
  const recentCommandItems = useMemo((): CommandItem[] => {
    if (query.trim()) return [];

    return recentItems
      .map((recent) => {
        if (recent.type === 'action') {
          const action = quickActions.find((a) => a.id === recent.id);
          return action ? { type: 'action' as const, item: action } : null;
        } else {
          const navItem = navigationItems.find((n) => n.id === recent.id);
          return navItem ? { type: 'navigation' as const, item: navItem } : null;
        }
      })
      .filter((item): item is CommandItem => item !== null);
  }, [query, recentItems, quickActions, navigationItems]);

  // Compute all items for keyboard navigation (recent + filtered)
  const allDisplayedItems = useMemo(() => {
    return [...recentCommandItems, ...filteredItems];
  }, [recentCommandItems, filteredItems]);

  // Reset state and focus when dialog opens
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        // Reset state when opening
        setQuery('');
        setSelectedIndex(0);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Derive clamped index - no effect needed
  const effectiveSelectedIndex = useMemo(() => {
    if (allDisplayedItems.length === 0) return 0;
    return Math.min(selectedIndex, allDisplayedItems.length - 1);
  }, [selectedIndex, allDisplayedItems.length]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(
      `[data-index="${effectiveSelectedIndex}"]`
    );
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [effectiveSelectedIndex]);

  // Execute selected item
  const executeItem = useCallback(
    (item: CommandItem) => {
      // Add to recent items
      const id = item.type === 'action' ? item.item.id : item.item.id;
      addRecentItem(id, item.type);

      if (item.type === 'action') {
        item.item.action();
      } else {
        navigate(item.item.path);
        onOpenChange(false);
      }
    },
    [navigate, onOpenChange, addRecentItem]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) =>
            i < allDisplayedItems.length - 1 ? i + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) =>
            i > 0 ? i - 1 : allDisplayedItems.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (allDisplayedItems[effectiveSelectedIndex]) {
            executeItem(allDisplayedItems[effectiveSelectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleOpenChange(false);
          break;
      }
    },
    [allDisplayedItems, effectiveSelectedIndex, executeItem, handleOpenChange]
  );

  // Render content shared between Dialog and Sheet
  const renderContent = () => (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      {/* Search input */}
      <div className="relative px-4 py-3 border-b border-border">
        <Search
          className="absolute left-7 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('commandPalette.placeholder')}
          className={cn(
            inputStyles,
            'pl-9 pr-12',
            'h-10 text-sm',
            'border-0 bg-transparent',
            'focus-visible:ring-0'
          )}
          aria-label={t('commandPalette.placeholder')}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {/* Keyboard hint - desktop only */}
        {!isMobile && (
          <kbd className="absolute right-7 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded">
            ESC
          </kbd>
        )}
      </div>

      {/* Results list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto overscroll-contain py-2"
        role="listbox"
        aria-label={t('commandPalette.results')}
      >
        {allDisplayedItems.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t('commandPalette.noResults')}
          </div>
        ) : (
          <>
            {/* Group: Recent Items */}
            {recentCommandItems.length > 0 && !query.trim() && (
              <div className="mb-2 mx-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('commandPalette.groups.recent')}
                </div>
                <div className="bg-muted/30 rounded-lg overflow-hidden">
                  {recentCommandItems.map((item, idx) => {
                    const isSelected = idx === effectiveSelectedIndex;
                    const Icon =
                      item.type === 'action'
                        ? item.item.icon
                        : item.item.icon || LayoutDashboard;
                    const label =
                      item.type === 'action'
                        ? t(item.item.labelKey)
                        : t(item.item.labelKey);

                    return (
                      <button
                        key={`recent-${item.type === 'action' ? item.item.id : item.item.id}`}
                        type="button"
                        data-index={idx}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => executeItem(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5',
                          'text-left text-sm',
                          'transition-colors duration-100',
                          'motion-reduce:transition-none',
                          'min-h-[44px]', // Touch target
                          isSelected
                            ? 'bg-accent text-accent-foreground'
                            : 'text-foreground hover:bg-accent/50'
                        )}
                      >
                        <Clock className="size-4 shrink-0 text-muted-foreground" />
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">{label}</span>
                        {isSelected && (
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Group: Quick Actions */}
            {filteredItems.some(isActionItem) && (
              <div className="mb-2 mx-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('commandPalette.groups.quickActions')}
                </div>
                <div className="bg-muted/30 rounded-lg overflow-hidden">
                  {filteredItems.filter(isActionItem).map((item) => {
                    const globalIdx =
                      recentCommandItems.length + filteredItems.indexOf(item);
                    const isSelected = globalIdx === effectiveSelectedIndex;
                    const action = item.item;
                    const Icon = action.icon;

                    return (
                      <button
                        key={action.id}
                        type="button"
                        data-index={globalIdx}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => executeItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5',
                          'text-left text-sm',
                          'transition-colors duration-100',
                          'motion-reduce:transition-none',
                          'min-h-[44px]', // Touch target
                          isSelected
                            ? 'bg-accent text-accent-foreground'
                            : 'text-foreground hover:bg-accent/50'
                        )}
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <HighlightedText
                          text={t(action.labelKey)}
                          query={query}
                          className="flex-1 truncate"
                        />
                        {isSelected && (
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Group: Navigation */}
            {filteredItems.some(isNavigationItem) && (
              <div className="mx-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('commandPalette.groups.navigation')}
                </div>
                <div className="bg-muted/30 rounded-lg overflow-hidden">
                  {filteredItems.filter(isNavigationItem).map((item) => {
                    const globalIdx =
                      recentCommandItems.length + filteredItems.indexOf(item);
                    const isSelected = globalIdx === effectiveSelectedIndex;
                    const navItem = item.item;
                    const Icon = navItem.icon || LayoutDashboard;

                    return (
                      <button
                        key={navItem.id}
                        type="button"
                        data-index={globalIdx}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => executeItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5',
                          'text-left text-sm',
                          'transition-colors duration-100',
                          'motion-reduce:transition-none',
                          'min-h-[44px]', // Touch target
                          isSelected
                            ? 'bg-accent text-accent-foreground'
                            : 'text-foreground hover:bg-accent/50'
                        )}
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <HighlightedText
                          text={t(navItem.labelKey)}
                          query={query}
                          className="flex-1 truncate"
                        />
                        {isSelected && (
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with keyboard hints - desktop only */}
      {!isMobile && (
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded font-mono text-[10px]">
              ↑
            </kbd>
            <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded font-mono text-[10px]">
              ↓
            </kbd>
            <span>{t('commandPalette.hints.navigate')}</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded font-mono text-[10px]">
              ↵
            </kbd>
            <span>{t('commandPalette.hints.select')}</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded font-mono text-[10px]">
              esc
            </kbd>
            <span>{t('commandPalette.hints.close')}</span>
          </span>
        </div>
      )}
    </div>
  );

  // Mobile: Bottom Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent showClose={false} className="h-[70dvh]">
          <SheetHeader className="sr-only">
            <SheetTitle>{t('commandPalette.title')}</SheetTitle>
          </SheetHeader>
          <SheetBody className="px-0">{renderContent()}</SheetBody>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">{t('commandPalette.title')}</DialogTitle>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export type { CommandPaletteProps };
