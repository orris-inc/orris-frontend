/**
 * Generic Install Script Sheet Component (Mobile)
 *
 * Mobile-first bottom drawer for displaying agent/node install scripts.
 * Mirrors the InstallScriptDialog feature set with a Vaul-powered Sheet
 * optimized for thumb reach and swipe-to-dismiss.
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Copy,
  Check,
  Terminal,
  Download,
  ChevronDown,
} from 'lucide-react';
import { safeWindowOpen } from '@/shared/utils/url-utils';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/common/sheet/Sheet';
import { cn } from '@/lib/utils';
import {
  InstanceNameField,
  type InstallScriptData,
  type MultiInstanceConfig,
} from './InstallScriptDialog';

interface InstallScriptSheetProps {
  open: boolean;
  onClose: () => void;
  data: InstallScriptData | null;
  entityName?: string;
  i18nNamespace: 'admin.forwardAgents.installScript' | 'admin.nodes.installScript';
  /** Enables the multi-instance name field when provided */
  multiInstance?: MultiInstanceConfig;
}

const CopyChip = ({
  copied,
  onCopy,
  className,
}: {
  copied: boolean;
  onCopy: () => void;
  className?: string;
}) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        'shrink-0 inline-flex items-center gap-1 px-2 h-7 rounded-md',
        'text-xs font-medium',
        'bg-muted/60 text-muted-foreground',
        'active:scale-[0.96] transition-all touch-target',
        copied && 'bg-success/10 text-success',
        className
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
};

const CodeBlock = ({
  children,
  variant = 'dark',
}: {
  children: React.ReactNode;
  variant?: 'dark' | 'light';
}) => {
  if (variant === 'dark') {
    return (
      <pre
        className={cn(
          'p-3 rounded-lg',
          'bg-[--color-code-bg,#0f172a] text-[--color-code-fg,#e2e8f0]',
          'text-xs font-mono leading-relaxed',
          'overflow-x-auto whitespace-pre-wrap break-all',
          'selection:bg-primary selection:text-primary-foreground'
        )}
      >
        {children}
      </pre>
    );
  }
  return (
    <div className="p-3 rounded-lg bg-muted text-xs font-mono break-all leading-relaxed">
      {children}
    </div>
  );
};

export const InstallScriptSheet: React.FC<InstallScriptSheetProps> = ({
  open,
  onClose,
  data,
  entityName,
  i18nNamespace,
  multiInstance,
}) => {
  const { t } = useTranslation();
  const installCopy = useCopyToClipboard();
  const uninstallCopy = useCopyToClipboard();
  const scriptUrlCopy = useCopyToClipboard();
  const apiUrlCopy = useCopyToClipboard();
  const tokenCopy = useCopyToClipboard();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleCopy = useCallback(
    (field: 'install' | 'uninstall' | 'scriptUrl' | 'apiUrl' | 'token', value: string | undefined) => {
      if (!value) return;
      const copyMap = {
        install: installCopy,
        uninstall: uninstallCopy,
        scriptUrl: scriptUrlCopy,
        apiUrl: apiUrlCopy,
        token: tokenCopy,
      };
      copyMap[field].copyToClipboard(value);
    },
    [installCopy, uninstallCopy, scriptUrlCopy, apiUrlCopy, tokenCopy]
  );

  const handleClose = useCallback(() => {
    installCopy.reset();
    uninstallCopy.reset();
    scriptUrlCopy.reset();
    apiUrlCopy.reset();
    tokenCopy.reset();
    setDetailsOpen(false);
    onClose();
  }, [installCopy, uninstallCopy, scriptUrlCopy, apiUrlCopy, tokenCopy, onClose]);

  if (!data) return null;

  const descriptionKey = entityName
    ? `${i18nNamespace}.descriptionWithName`
    : `${i18nNamespace}.description`;

  const hasDetails = !!(data.apiUrl || data.token);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent showClose>
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg flex items-center justify-center bg-primary/10 shrink-0">
              <Terminal className="size-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 pr-8">
              <SheetTitle className="truncate">
                {t(`${i18nNamespace}.title`)}
              </SheetTitle>
              <SheetDescription className="truncate mt-0.5">
                {entityName
                  ? t(descriptionKey, { name: entityName })
                  : t(`${i18nNamespace}.description`)}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="space-y-4 pb-4">
          {/* Instance name (multi-instance install) */}
          {multiInstance && (
            <InstanceNameField
              config={multiInstance}
              i18nNamespace={i18nNamespace}
            />
          )}

          {/* Primary install command */}
          {data.installCommand && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[13px] font-medium flex items-center gap-1.5">
                  {t(`${i18nNamespace}.installCommand`)}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    {t(`${i18nNamespace}.recommended`)}
                  </span>
                </h4>
                <CopyChip
                  copied={installCopy.copied}
                  onCopy={() => handleCopy('install', data.installCommand)}
                />
              </div>
              <CodeBlock>{data.installCommand}</CodeBlock>
              <p className="text-[11px] text-muted-foreground mt-2">
                {t(`${i18nNamespace}.installCommandHint`)}
              </p>
            </div>
          )}

          {/* Uninstall command */}
          {data.uninstallCommand && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <h4 className="text-[13px] font-medium">
                  {t(`${i18nNamespace}.uninstallCommand`)}
                </h4>
                <CopyChip
                  copied={uninstallCopy.copied}
                  onCopy={() => handleCopy('uninstall', data.uninstallCommand)}
                />
              </div>
              <CodeBlock>{data.uninstallCommand}</CodeBlock>
            </div>
          )}

          {/* Script URL */}
          {data.scriptUrl && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1 gap-2">
                <h4 className="text-[13px] font-medium">
                  {t(`${i18nNamespace}.scriptUrl`)}
                </h4>
                <div className="flex items-center gap-1">
                  <CopyChip
                    copied={scriptUrlCopy.copied}
                    onCopy={() => handleCopy('scriptUrl', data.scriptUrl)}
                  />
                  <button
                    type="button"
                    onClick={() => safeWindowOpen(data.scriptUrl!)}
                    className={cn(
                      'shrink-0 inline-flex items-center gap-1 px-2 h-7 rounded-md',
                      'text-xs font-medium',
                      'bg-muted/60 text-muted-foreground',
                      'active:scale-[0.96] transition-all touch-target'
                    )}
                  >
                    <Download className="size-3.5" />
                    {t('common.open')}
                  </button>
                </div>
              </div>
              <CodeBlock variant="light">{data.scriptUrl}</CodeBlock>
            </div>
          )}

          {/* Collapsible details: API URL + Token */}
          {hasDetails && (
            <div>
              <button
                type="button"
                onClick={() => setDetailsOpen((prev) => !prev)}
                className={cn(
                  'w-full flex items-center justify-between px-1 py-1.5',
                  'text-[13px] font-medium text-foreground',
                  'touch-target'
                )}
              >
                <span>{t(`${i18nNamespace}.viewDetails`)}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {detailsOpen
                    ? t(`${i18nNamespace}.clickToCollapse`)
                    : t(`${i18nNamespace}.clickToExpand`)}
                  <ChevronDown
                    className={cn(
                      'size-3.5 transition-transform',
                      detailsOpen && 'rotate-180'
                    )}
                  />
                </span>
              </button>

              {detailsOpen && (
                <div className="mt-2 space-y-3">
                  {data.apiUrl && (
                    <div>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <h5 className="text-[13px] font-medium">
                          {t(`${i18nNamespace}.apiUrl`, { defaultValue: 'API URL' })}
                        </h5>
                        <CopyChip
                          copied={apiUrlCopy.copied}
                          onCopy={() => handleCopy('apiUrl', data.apiUrl)}
                        />
                      </div>
                      <CodeBlock variant="light">{data.apiUrl}</CodeBlock>
                    </div>
                  )}
                  {data.token && (
                    <div>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <h5 className="text-[13px] font-medium">Token</h5>
                        <CopyChip
                          copied={tokenCopy.copied}
                          onCopy={() => handleCopy('token', data.token)}
                        />
                      </div>
                      <CodeBlock variant="light">{data.token}</CodeBlock>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetBody>

        <SheetFooter>
          <button
            type="button"
            onClick={() => handleCopy('install', data.installCommand)}
            disabled={!data.installCommand}
            className={cn(
              'flex items-center justify-center gap-1.5',
              'h-11 rounded-lg w-full',
              'bg-primary text-primary-foreground',
              'text-sm font-medium',
              'active:opacity-80 active:scale-[0.98] transition-all',
              'disabled:opacity-50'
            )}
          >
            {installCopy.copied ? (
              <>
                <Check className="size-4" />
                {t('common.copied')}
              </>
            ) : (
              <>
                <Copy className="size-4" />
                {t(`${i18nNamespace}.installCommand`)}
              </>
            )}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

InstallScriptSheet.displayName = 'InstallScriptSheet';
