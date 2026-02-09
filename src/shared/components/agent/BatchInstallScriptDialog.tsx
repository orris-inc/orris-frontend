/**
 * Batch Install Script Dialog Component
 * Displays batch install command for multiple nodes
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Terminal, Download, Server } from 'lucide-react';
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
import type { BatchInstallScriptResponse } from '@/api/node';

interface BatchInstallScriptDialogProps {
  open: boolean;
  onClose: () => void;
  /** Batch install script data */
  data: BatchInstallScriptResponse | null;
  /** Number of selected nodes */
  nodeCount?: number;
  /** i18n namespace for translations */
  i18nNamespace?: 'admin.nodes.installScript' | 'userNodes.installScript';
  /** Loading state */
  isLoading?: boolean;
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
          <Check className="size-3.5 mr-1 text-success" />
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
      <pre className="p-3 rounded-lg bg-[--color-code-bg,#0f172a] text-[--color-code-fg,#e2e8f0] text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all selection:bg-primary selection:text-primary-foreground">
        {children}
      </pre>
    );
  }
  return (
    <div className="p-3 rounded-lg bg-muted text-sm font-mono break-all">
      {children}
    </div>
  );
};

export const BatchInstallScriptDialog: React.FC<BatchInstallScriptDialogProps> = ({
  open,
  onClose,
  data,
  nodeCount,
  i18nNamespace = 'admin.nodes.installScript',
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const installCopy = useCopyToClipboard();
  const uninstallCopy = useCopyToClipboard();
  const scriptUrlCopy = useCopyToClipboard();
  const [copiedTokens, setCopiedTokens] = useState<Record<string, boolean>>({});

  const handleCopy = useCallback((field: string, value: string | undefined) => {
    if (!value) return;
    const copyMap = {
      install: installCopy,
      uninstall: uninstallCopy,
      scriptUrl: scriptUrlCopy,
    };
    copyMap[field as keyof typeof copyMap]?.copyToClipboard(value);
  }, [installCopy, uninstallCopy, scriptUrlCopy]);

  const handleCopyToken = useCallback((index: number, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedTokens((prev) => ({ ...prev, [`token-${index}`]: true }));
    setTimeout(() => {
      setCopiedTokens((prev) => ({ ...prev, [`token-${index}`]: false }));
    }, 2000);
  }, []);

  const handleClose = useCallback(() => {
    installCopy.reset();
    uninstallCopy.reset();
    scriptUrlCopy.reset();
    setCopiedTokens({});
    onClose();
  }, [installCopy, uninstallCopy, scriptUrlCopy, onClose]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="size-5" />
            {t(`${i18nNamespace}.batchTitle`)}
          </DialogTitle>
          <DialogDescription>
            {nodeCount
              ? t(`${i18nNamespace}.batchDescription`, { count: nodeCount })
              : t(`${i18nNamespace}.batchDescriptionGeneric`)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              {t('common.table.loading')}
            </div>
          ) : !data ? (
            <div className="py-8 text-center text-muted-foreground">
              {t(`${i18nNamespace}.noData`)}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Batch install command (primary) */}
              {data.installCommand && (
                <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      {t(`${i18nNamespace}.batchInstallCommand`)}
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
                    {t(`${i18nNamespace}.batchInstallHint`)}
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

              {/* Node list (collapsible) */}
              {data.nodes && data.nodes.length > 0 && (
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Server className="size-4 text-muted-foreground" />
                      {t(`${i18nNamespace}.includedNodes`)}
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {data.nodes.length}
                      </span>
                    </h4>
                    <span className="text-xs text-muted-foreground group-open:hidden">
                      {t(`${i18nNamespace}.clickToExpand`)}
                    </span>
                    <span className="text-xs text-muted-foreground hidden group-open:inline">
                      {t(`${i18nNamespace}.clickToCollapse`)}
                    </span>
                  </summary>
                  <div className="mt-3 space-y-2">
                    {data.nodes.map((node, index) => (
                      <div
                        key={node.nodeSid}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-6">
                            {index + 1}.
                          </span>
                          <code className="font-mono text-xs">{node.nodeSid}</code>
                        </div>
                        <CopyButton
                          copied={copiedTokens[`token-${index}`] ?? false}
                          onCopy={() => handleCopyToken(index, node.token)}
                        />
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
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
