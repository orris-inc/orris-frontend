/**
 * User node install script dialog component
 * Displays install script and one-click install command
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Terminal, Download } from 'lucide-react';
import { safeWindowOpen } from '@/shared/utils/url-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import type { UserNodeInstallScriptResponse } from '@/api/node';

interface UserNodeInstallScriptDialogProps {
  open: boolean;
  installScriptData: UserNodeInstallScriptResponse | null;
  nodeName?: string;
  isLoading?: boolean;
  onClose: () => void;
}

export const UserNodeInstallScriptDialog: React.FC<UserNodeInstallScriptDialogProps> = ({
  open,
  installScriptData,
  nodeName,
  isLoading = false,
  onClose,
}) => {
  const { t } = useTranslation();
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedUninstall, setCopiedUninstall] = useState(false);
  const [copiedScriptUrl, setCopiedScriptUrl] = useState(false);
  const [copiedApiUrl, setCopiedApiUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleCopyInstall = () => {
    if (installScriptData?.installCommand) {
      navigator.clipboard.writeText(installScriptData.installCommand);
      setCopiedInstall(true);
      setTimeout(() => setCopiedInstall(false), 2000);
    }
  };

  const handleCopyUninstall = () => {
    if (installScriptData?.uninstallCommand) {
      navigator.clipboard.writeText(installScriptData.uninstallCommand);
      setCopiedUninstall(true);
      setTimeout(() => setCopiedUninstall(false), 2000);
    }
  };

  const handleCopyScriptUrl = () => {
    if (installScriptData?.scriptUrl) {
      navigator.clipboard.writeText(installScriptData.scriptUrl);
      setCopiedScriptUrl(true);
      setTimeout(() => setCopiedScriptUrl(false), 2000);
    }
  };

  const handleCopyApiUrl = () => {
    if (installScriptData?.apiUrl) {
      navigator.clipboard.writeText(installScriptData.apiUrl);
      setCopiedApiUrl(true);
      setTimeout(() => setCopiedApiUrl(false), 2000);
    }
  };

  const handleCopyToken = () => {
    if (installScriptData?.token) {
      navigator.clipboard.writeText(installScriptData.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleClose = () => {
    setCopiedInstall(false);
    setCopiedUninstall(false);
    setCopiedScriptUrl(false);
    setCopiedApiUrl(false);
    setCopiedToken(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[650px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="size-5" />
            {t('userNodes.installScript.title')}
          </DialogTitle>
          <DialogDescription>
            {nodeName
              ? t('userNodes.installScript.descriptionWithNode', { name: nodeName })
              : t('userNodes.installScript.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            {t('common.table.loading')}
          </div>
        ) : !installScriptData ? (
          <div className="py-8 text-center text-muted-foreground">
            {t('userNodes.installScript.noData')}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Install command (main) */}
            {installScriptData.installCommand && (
              <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    {t('userNodes.installScript.installCommand')}
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t('common.recommended')}</span>
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyInstall}
                    className="h-7 px-2"
                  >
                    {copiedInstall ? (
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
                </div>
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all selection:bg-blue-500 selection:text-white">
                    {installScriptData.installCommand}
                  </pre>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('userNodes.installScript.installHint')}
                </p>
              </div>
            )}

            {/* Uninstall command */}
            {installScriptData.uninstallCommand && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">{t('userNodes.installScript.uninstallCommand')}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyUninstall}
                    className="h-7 px-2"
                  >
                    {copiedUninstall ? (
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
                </div>
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all selection:bg-blue-500 selection:text-white">
                    {installScriptData.uninstallCommand}
                  </pre>
                </div>
              </div>
            )}

            {/* Script URL */}
            {installScriptData.scriptUrl && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">{t('userNodes.installScript.scriptUrl')}</h4>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyScriptUrl}
                      className="h-7 px-2"
                    >
                      {copiedScriptUrl ? (
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => safeWindowOpen(installScriptData.scriptUrl)}
                      className="h-7 px-2"
                    >
                      <Download className="size-3.5 mr-1" />
                      {t('common.open')}
                    </Button>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-mono break-all">
                  {installScriptData.scriptUrl}
                </div>
              </div>
            )}

            {/* Details (collapsible) */}
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h4 className="text-sm font-medium">{t('userNodes.installScript.viewDetails')}</h4>
                <span className="text-xs text-muted-foreground group-open:hidden">{t('userNodes.installScript.clickToExpand')}</span>
                <span className="text-xs text-muted-foreground hidden group-open:inline">{t('userNodes.installScript.clickToCollapse')}</span>
              </summary>
              <div className="mt-3 space-y-3">
                {/* API URL */}
                {installScriptData.apiUrl && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium">{t('userNodes.installScript.apiUrl')}</h5>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyApiUrl}
                        className="h-7 px-2"
                      >
                        {copiedApiUrl ? (
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
                    </div>
                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-mono break-all">
                      {installScriptData.apiUrl}
                    </div>
                  </div>
                )}

                {/* Token */}
                {installScriptData.token && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium">{t('userNodes.installScript.token')}</h5>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyToken}
                        className="h-7 px-2"
                      >
                        {copiedToken ? (
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
                    </div>
                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-mono break-all">
                      {installScriptData.token}
                    </div>
                  </div>
                )}
              </div>
            </details>
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
