/**
 * SelectSheet - Mobile Select Picker
 *
 * A bottom sheet for selecting from a list of options.
 * More mobile-friendly than popover-style selects.
 *
 * Features:
 * - Bottom drawer presentation (vaul)
 * - Check mark on selected item
 * - Optional search/filter
 * - Optional grouped options
 * - Touch-friendly 48px targets
 * - Keyboard-aware positioning
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from 'vaul';
import { Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  SelectSheetProps,
  SelectSheetOption,
  SelectSheetOptionGroup,
} from './types';

export function SelectSheet<T extends string = string>({
  open,
  onOpenChange,
  value,
  onChange,
  options,
  groups,
  title,
  description,
  searchable = false,
  searchPlaceholder,
  closeOnSelect = true,
}: SelectSheetProps<T>) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('common.placeholders.search');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Reset search when sheet closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setIsScrolled(false);
    }
  }, [open]);

  // Keyboard-aware positioning using Visual Viewport API
  useEffect(() => {
    if (!open || !searchable) return;

    const content = contentRef.current;
    const vv = window.visualViewport;
    if (!content || !vv) return;

    const updatePosition = () => {
      const keyboardHeight = window.innerHeight - vv.height;
      const hasKeyboard = keyboardHeight > 100;

      if (hasKeyboard) {
        const maxSheetHeight = vv.height * 0.7;
        content.style.height = `${maxSheetHeight}px`;
        content.style.bottom = `${keyboardHeight}px`;
      } else {
        content.style.height = '';
        content.style.bottom = '';
      }
    };

    updatePosition();
    vv.addEventListener('resize', updatePosition);
    vv.addEventListener('scroll', updatePosition);

    return () => {
      vv.removeEventListener('resize', updatePosition);
      vv.removeEventListener('scroll', updatePosition);
      content.style.height = '';
      content.style.bottom = '';
    };
  }, [open, searchable]);

  // Smart scroll detection for drag-to-close
  const handleScroll = useCallback(() => {
    const body = bodyRef.current;
    if (!body) return;
    const scrolled = body.scrollTop > 1;
    if (scrolled !== isScrolled) {
      setIsScrolled(scrolled);
    }
  }, [isScrolled]);

  // Normalize to groups format for unified rendering
  const normalizedGroups = useMemo((): SelectSheetOptionGroup<T>[] => {
    if (groups) return groups;
    if (options) return [{ label: '', options }];
    return [];
  }, [options, groups]);

  // Filter options by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return normalizedGroups;

    const query = searchQuery.toLowerCase();
    return normalizedGroups
      .map((group) => ({
        ...group,
        options: group.options.filter(
          (opt) =>
            opt.label.toLowerCase().includes(query) ||
            opt.description?.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.options.length > 0);
  }, [normalizedGroups, searchQuery]);

  // Handle option selection
  const handleSelect = useCallback(
    (optionValue: T) => {
      onChange(optionValue);
      if (closeOnSelect) {
        onOpenChange(false);
      }
    },
    [onChange, onOpenChange, closeOnSelect]
  );

  // Check if an option is selected
  const isSelected = useCallback(
    (optionValue: T) => value === optionValue,
    [value]
  );

  // Render single option
  const renderOption = (option: SelectSheetOption<T>) => {
    const selected = isSelected(option.value);

    return (
      <button
        key={option.value}
        type="button"
        onClick={() => !option.disabled && handleSelect(option.value)}
        disabled={option.disabled}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3',
          'min-h-[48px] text-left',
          'transition-colors duration-150',
          'active:bg-muted/50',
          option.disabled && 'opacity-50 cursor-not-allowed',
          selected && 'bg-primary/5'
        )}
      >
        {/* Color indicator */}
        {option.color && (
          <span
            className={cn('size-3 rounded-full flex-shrink-0', option.color)}
          />
        )}

        {/* Icon */}
        {option.icon && (
          <span className="flex-shrink-0 text-muted-foreground">
            {option.icon}
          </span>
        )}

        {/* Label & Description */}
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'text-[15px] truncate',
              selected ? 'text-primary font-medium' : 'text-foreground'
            )}
          >
            {option.label}
          </div>
          {option.description && (
            <div className="text-[13px] text-muted-foreground truncate">
              {option.description}
            </div>
          )}
        </div>

        {/* Check mark */}
        {selected && (
          <Check className="size-5 text-primary flex-shrink-0" />
        )}
      </button>
    );
  };

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      repositionInputs={false}
      scrollLockTimeout={500}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          ref={contentRef}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50',
            'w-full max-h-[70vh] max-h-[70dvh]',
            'rounded-t-2xl',
            'bg-background border-t border-border',
            'flex flex-col',
            'pb-[env(safe-area-inset-bottom)]',
            'outline-none'
          )}
        >
          {/* Drag handle */}
          <Drawer.Handle className="mx-auto mt-3 mb-2 h-1.5 w-10 rounded-full bg-muted-foreground/30" />

          {/* Header */}
          {(title || description) && (
            <div className="flex-shrink-0 px-4 pb-3 border-b border-border">
              {title && (
                <Drawer.Title className="text-base font-semibold text-foreground">
                  {title}
                </Drawer.Title>
              )}
              {description && (
                <Drawer.Description className="text-sm text-muted-foreground mt-0.5">
                  {description}
                </Drawer.Description>
              )}
            </div>
          )}

          {/* Search input */}
          {searchable && (
            <div className="flex-shrink-0 px-4 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={resolvedSearchPlaceholder}
                  className={cn(
                    'w-full h-10 pl-9 pr-9',
                    'text-[15px] rounded-lg',
                    'bg-muted/50 border-0',
                    'placeholder:text-muted-foreground/60',
                    'focus:outline-none focus:ring-2 focus:ring-primary/20'
                  )}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options list */}
          <div
            ref={bodyRef}
            data-vaul-no-drag={isScrolled || undefined}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          >
            {filteredGroups.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                {searchQuery ? t('common.messages.noResults') : t('common.messages.noData')}
              </div>
            ) : (
              filteredGroups.map((group, groupIndex) => (
                <div key={group.label || groupIndex}>
                  {/* Group label (only show if has label) */}
                  {group.label && (
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30">
                      {group.label}
                    </div>
                  )}
                  {/* Group options */}
                  <div className="divide-y divide-border/50">
                    {group.options.map(renderOption)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

SelectSheet.displayName = 'SelectSheet';
