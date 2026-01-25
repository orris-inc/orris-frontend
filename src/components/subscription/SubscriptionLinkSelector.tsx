/**
 * Subscription Link Selector Component
 * Modern card design with text list and QR code views
 *
 * Design: Bento Box + Dimensional Layering
 * - Clean modular cards with rounded corners (rounded-xl)
 * - Subtle shadows for depth
 * - Smooth transitions (ease-out, 200ms)
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy,
  Check,
  Globe,
  ArrowRightLeft,
  Server,
  List,
  QrCode,
} from 'lucide-react';
import { buildSubscriptionLink } from '@/api/subscription';
import type {
  SubscriptionLinkFormat,
  SubscriptionNodeMode,
} from '@/api/subscription/types';
import { cn } from '@/lib/utils';

type ViewMode = 'text' | 'qrcode';

/**
 * Link format configuration
 */
const LINK_FORMATS: { format: SubscriptionLinkFormat | undefined; label: string }[] = [
  { format: undefined, label: 'Base64' },
  { format: 'clash', label: 'Clash' },
  { format: 'v2ray', label: 'V2Ray' },
  { format: 'sip008', label: 'SIP008' },
  { format: 'surge', label: 'Surge' },
];

/**
 * Node mode configuration
 */
const NODE_MODES: { mode: SubscriptionNodeMode; labelKey: string; icon: React.ElementType }[] = [
  { mode: 'forward', labelKey: 'subscriptionLink.nodeMode.forward', icon: ArrowRightLeft },
  { mode: 'origin', labelKey: 'subscriptionLink.nodeMode.origin', icon: Server },
  { mode: 'all', labelKey: 'subscriptionLink.nodeMode.all', icon: Globe },
];

interface SubscriptionLinkSelectorProps {
  subscribeUrl: string;
  compact?: boolean;
  className?: string;
}

/**
 * Pill button for mode/view selection
 */
const PillButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ active, onClick, children, className }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ease-out cursor-pointer',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
      active
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
      className
    )}
  >
    {children}
  </button>
);

/**
 * Icon toggle button
 */
const IconToggle: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className={cn(
      'p-2 rounded-lg transition-all duration-200 ease-out cursor-pointer',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
      active
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    )}
  >
    <Icon className="size-4" />
  </button>
);

/**
 * Copy button with feedback animation
 */
const CopyButton: React.FC<{ text: string; variant?: 'default' | 'pill' }> = ({
  text,
  variant = 'default',
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copy failed silently
    }
  };

  if (variant === 'pill') {
    return (
      <button
        onClick={handleCopy}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
          'transition-all duration-200 ease-out cursor-pointer',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          copied
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
        )}
      >
        {copied ? (
          <>
            <Check className="size-3.5" />
            {t('common.copied')}
          </>
        ) : (
          <>
            <Copy className="size-3.5" />
            {t('common.actions.copy')}
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'p-1.5 rounded-md transition-all duration-200 ease-out cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        copied
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      )}
      title={copied ? t('common.copied') : t('subscriptionLink.copyLink')}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  );
};

/**
 * Format tab for QR code view
 */
const FormatTab: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ease-out cursor-pointer',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
      active
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    )}
  >
    {label}
  </button>
);

/**
 * Link row in text view
 */
const LinkRow: React.FC<{
  label: string;
  url: string;
  compact?: boolean;
}> = ({ label, url, compact }) => (
  <div
    className={cn(
      'group flex items-center gap-3 rounded-lg transition-colors duration-150',
      'bg-muted/40 hover:bg-muted/60',
      compact ? 'px-3 py-2' : 'px-4 py-3'
    )}
  >
    <span
      className={cn(
        'shrink-0 font-medium text-foreground',
        compact ? 'text-xs w-14' : 'text-sm w-16'
      )}
    >
      {label}
    </span>
    <span
      className={cn(
        'flex-1 font-mono text-muted-foreground truncate',
        compact ? 'text-[11px]' : 'text-xs'
      )}
    >
      {url}
    </span>
    <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
      <CopyButton text={url} />
    </div>
  </div>
);

/**
 * Subscription Link Selector
 */
export const SubscriptionLinkSelector: React.FC<SubscriptionLinkSelectorProps> = ({
  subscribeUrl,
  compact = false,
  className,
}) => {
  const { t } = useTranslation();
  const [nodeMode, setNodeMode] = useState<SubscriptionNodeMode>('forward');
  const [viewMode, setViewMode] = useState<ViewMode>('text');
  const [selectedFormat, setSelectedFormat] = useState<string>('Clash');

  const subscription = useMemo(() => ({ subscribeUrl }), [subscribeUrl]);

  const urls = useMemo(() => {
    return LINK_FORMATS.map(({ format, label }) => ({
      label,
      url: buildSubscriptionLink(subscription, format, { mode: nodeMode }),
    }));
  }, [subscription, nodeMode]);

  const selectedUrl = useMemo(() => {
    return urls.find((u) => u.label === selectedFormat)?.url ?? urls[0].url;
  }, [urls, selectedFormat]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Node mode pills */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-muted/50">
          {NODE_MODES.map(({ mode, labelKey, icon: Icon }) => (
            <PillButton
              key={mode}
              active={nodeMode === mode}
              onClick={() => setNodeMode(mode)}
              className="flex items-center gap-1.5"
            >
              <Icon className="size-3.5" />
              {!compact && t(labelKey)}
            </PillButton>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
          <IconToggle
            active={viewMode === 'text'}
            onClick={() => setViewMode('text')}
            icon={List}
            label={t('subscriptionLink.viewMode.textList')}
          />
          <IconToggle
            active={viewMode === 'qrcode'}
            onClick={() => setViewMode('qrcode')}
            icon={QrCode}
            label={t('subscriptionLink.viewMode.qrCode')}
          />
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          'transition-all duration-300 ease-out',
          'motion-reduce:transition-none'
        )}
      >
        {viewMode === 'text' ? (
          /* Text List View */
          <div className="space-y-2">
            {urls.map(({ label, url }) => (
              <LinkRow
                key={label}
                label={label}
                url={url}
                compact={compact}
              />
            ))}
          </div>
        ) : (
          /* QR Code View */
          <div className="space-y-4">
            {/* Format tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-muted/50 overflow-x-auto">
              {LINK_FORMATS.map(({ label }) => (
                <FormatTab
                  key={label}
                  label={label}
                  active={selectedFormat === label}
                  onClick={() => setSelectedFormat(label)}
                />
              ))}
            </div>

            {/* QR Code Card */}
            <div
              className={cn(
                'flex flex-col items-center gap-4 p-6 rounded-2xl',
                'bg-gradient-to-b from-muted/30 to-muted/50',
                'border border-border/50'
              )}
            >
              {/* QR Code */}
              <div
                className={cn(
                  'p-4 bg-white rounded-xl shadow-sm',
                  'ring-1 ring-black/5'
                )}
              >
                <QRCodeSVG
                  value={selectedUrl}
                  size={compact ? 140 : 180}
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* URL preview + copy */}
              <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                <p
                  className={cn(
                    'font-mono text-muted-foreground text-center break-all line-clamp-2',
                    compact ? 'text-[10px]' : 'text-xs'
                  )}
                >
                  {selectedUrl}
                </p>
                <CopyButton text={selectedUrl} variant="pill" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
