/**
 * Generic Install Script Dialog Component
 * Reusable dialog for displaying agent/node install scripts
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Terminal, Download } from 'lucide-react';
import { safeWindowOpen } from '@/shared/utils/url-utils';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';

/**
 * Common install script data structure
 */
export interface InstallScriptData {
  installCommand?: string;
  uninstallCommand?: string;
  scriptUrl?: string;
  /** API URL or Server URL */
  apiUrl?: string;
  token?: string;
}

interface InstallScriptDialogProps {
  open: boolean;
  onClose: () => void;
  /** Install script data */
  data: InstallScriptData | null;
  /** Entity name (agent/node name) */
  entityName?: string;
  /** i18n namespace for translations */
  i18nNamespace: 'admin.forwardAgents.installScript' | 'admin.nodes.installScript';
}

/**
 * Copy button with feedback
 */
const CopyButton = ({
  copied,
  onCopy,
}: {
  copied: boolean;
  onCopy: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <Button variant="ghost" size="sm" onClick={onCopy} className="h-7 px-2">
      {copied ? (
        <>
          <Check className="size-3.5 mr-1 text-green-500" />
          {t('common.copied')}
        </>
      ) : (
        <>
          <Copy className="size-3.5 mr-1" />
          {t('common.actions.copy')}
        </>
      )}
    </Button>
  );
};

/**
 * Code block component
 */
const CodeBlock = ({
  children,
  variant = 'dark',
}: {
  children: React.ReactNode;
  variant?: 'dark' | 'light';
}) => {
  if (variant === 'dark') {
    return (
      <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all selection:bg-blue-500 selection:text-white">
        {children}
      </pre>
    );
  }
  return (
    <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-mono break-all">
      {children}
    </div>
  );
};

export const InstallScriptDialog: React.FC<InstallScriptDialogProps> = ({
  open,
  onClose,
  data,
  entityName,
  i18nNamespace,
}) => {
  const { t } = useTranslation();
  const installCopy = useCopyToClipboard();
  const uninstallCopy = useCopyToClipboard();
  const scriptUrlCopy = useCopyToClipboard();
  const apiUrlCopy = useCopyToClipboard();
  const tokenCopy = useCopyToClipboard();

  const handleCopy = useCallback((field: string, value: string | undefined) => {
    if (!value) return;
    const copyMap = {
      install: installCopy,
      uninstall: uninstallCopy,
      scriptUrl: scriptUrlCopy,
      apiUrl: apiUrlCopy,
      token: tokenCopy,
    };
    copyMap[field as keyof typeof copyMap]?.copyToClipboard(value);
  }, [installCopy, uninstallCopy, scriptUrlCopy, apiUrlCopy, tokenCopy]);

  const handleClose = useCallback(() => {
    installCopy.reset();
    uninstallCopy.reset();
    scriptUrlCopy.reset();
    apiUrlCopy.reset();
    tokenCopy.reset();
    onClose();
  }, [installCopy, uninstallCopy, scriptUrlCopy, apiUrlCopy, tokenCopy, onClose]);

  if (!data) return null;

  const descriptionKey = entityName
    ? `${i18nNamespace}.descriptionWithName`
    : `${i18nNamespace}.description`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="size-5" />
            {t(`${i18nNamespace}.title`)}
          </DialogTitle>
          <DialogDescription>
            {entityName
              ? t(descriptionKey, { name: entityName })
              : t(`${i18nNamespace}.description`)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-4">
            {/* Install command (primary) */}
            {data.installCommand && (
              <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    {t(`${i18nNamespace}.installCommand`)}
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {t(`${i18nNamespace}.recommended`)}
                    </span>
                  </h4>
                  <CopyButton
                    copied={installCopy.copied}
                    onCopy={() => handleCopy('install', data.installCommand)}
                  />
                </div>
                <CodeBlock>{data.installCommand}</CodeBlock>
                <p className="text-xs text-muted-foreground mt-2">
                  {t(`${i18nNamespace}.installCommandHint`)}
                </p>
              </div>
            )}

            {/* Uninstall command */}
            {data.uninstallCommand && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">
                    {t(`${i18nNamespace}.uninstallCommand`)}
                  </h4>
                  <CopyButton
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
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">
                    {t(`${i18nNamespace}.scriptUrl`)}
                  </h4>
                  <div className="flex gap-1">
                    <CopyButton
                      copied={scriptUrlCopy.copied}
                      onCopy={() => handleCopy('scriptUrl', data.scriptUrl)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => safeWindowOpen(data.scriptUrl!)}
                      className="h-7 px-2"
                    >
                      <Download className="size-3.5 mr-1" />
                      {t('common.open')}
                    </Button>
                  </div>
                </div>
                <CodeBlock variant="light">{data.scriptUrl}</CodeBlock>
              </div>
            )}

            {/* Other info (collapsible) */}
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h4 className="text-sm font-medium">
                  {t(`${i18nNamespace}.viewDetails`)}
                </h4>
                <span className="text-xs text-muted-foreground group-open:hidden">
                  {t(`${i18nNamespace}.clickToExpand`)}
                </span>
                <span className="text-xs text-muted-foreground hidden group-open:inline">
                  {t(`${i18nNamespace}.clickToCollapse`)}
                </span>
              </summary>
              <div className="mt-3 space-y-3">
                {/* API URL */}
                {data.apiUrl && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium">
                        {t(`${i18nNamespace}.apiUrl`, { defaultValue: t(`${i18nNamespace}.serverUrl`, { defaultValue: 'API URL' }) })}
                      </h5>
                      <CopyButton
                        copied={apiUrlCopy.copied}
                        onCopy={() => handleCopy('apiUrl', data.apiUrl)}
                      />
                    </div>
                    <CodeBlock variant="light">{data.apiUrl}</CodeBlock>
                  </div>
                )}

                {/* Token */}
                {data.token && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium">Token</h5>
                      <CopyButton
                        copied={tokenCopy.copied}
                        onCopy={() => handleCopy('token', data.token)}
                      />
                    </div>
                    <CodeBlock variant="light">{data.token}</CodeBlock>
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            {t('common.actions.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
