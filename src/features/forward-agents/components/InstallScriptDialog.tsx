/**
 * Install Script Dialog Component
 * Display Agent install script and one-click install command
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
import type { InstallCommandResponse } from '@/api/forward';

interface InstallScriptDialogProps {
  open: boolean;
  installCommandData: InstallCommandResponse | null;
  agentName?: string;
  onClose: () => void;
}

export const InstallScriptDialog: React.FC<InstallScriptDialogProps> = ({
  open,
  installCommandData,
  agentName,
  onClose,
}) => {
  const { t } = useTranslation();
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedUninstall, setCopiedUninstall] = useState(false);
  const [copiedScriptUrl, setCopiedScriptUrl] = useState(false);
  const [copiedServerUrl, setCopiedServerUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleCopyInstall = () => {
    if (installCommandData?.installCommand) {
      navigator.clipboard.writeText(installCommandData.installCommand);
      setCopiedInstall(true);
      setTimeout(() => setCopiedInstall(false), 2000);
    }
  };

  const handleCopyUninstall = () => {
    if (installCommandData?.uninstallCommand) {
      navigator.clipboard.writeText(installCommandData.uninstallCommand);
      setCopiedUninstall(true);
      setTimeout(() => setCopiedUninstall(false), 2000);
    }
  };

  const handleCopyScriptUrl = () => {
    if (installCommandData?.scriptUrl) {
      navigator.clipboard.writeText(installCommandData.scriptUrl);
      setCopiedScriptUrl(true);
      setTimeout(() => setCopiedScriptUrl(false), 2000);
    }
  };

  const handleCopyServerUrl = () => {
    if (installCommandData?.serverUrl) {
      navigator.clipboard.writeText(installCommandData.serverUrl);
      setCopiedServerUrl(true);
      setTimeout(() => setCopiedServerUrl(false), 2000);
    }
  };

  const handleCopyToken = () => {
    if (installCommandData?.token) {
      navigator.clipboard.writeText(installCommandData.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleClose = () => {
    setCopiedInstall(false);
    setCopiedUninstall(false);
    setCopiedScriptUrl(false);
    setCopiedServerUrl(false);
    setCopiedToken(false);
    onClose();
  };

  if (!installCommandData) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="size-5" />
            {t("admin.forwardAgents.installScript.title")}
          </DialogTitle>
          <DialogDescription>
            {agentName
              ? t("admin.forwardAgents.installScript.descriptionWithName", { name: agentName })
              : t("admin.forwardAgents.installScript.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Install command (main) */}
          {installCommandData.installCommand && (
            <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  {t("admin.forwardAgents.installScript.installCommand")}
                  <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t("admin.forwardAgents.installScript.recommended")}</span>
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
                      {t("common.copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 mr-1" />
                      {t("common.copy")}
                    </>
                  )}
                </Button>
              </div>
              <div className="relative">
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all selection:bg-blue-500 selection:text-white">
                  {installCommandData.installCommand}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("admin.forwardAgents.installScript.installCommandHint")}
              </p>
            </div>
          )}

          {/* Uninstall command */}
          {installCommandData.uninstallCommand && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">{t("admin.forwardAgents.installScript.uninstallCommand")}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyUninstall}
                  className="h-7 px-2"
                >
                  {copiedUninstall ? (
                    <>
                      <Check className="size-3.5 mr-1 text-green-500" />
                      {t("common.copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 mr-1" />
                      {t("common.copy")}
                    </>
                  )}
                </Button>
              </div>
              <div className="relative">
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all selection:bg-blue-500 selection:text-white">
                  {installCommandData.uninstallCommand}
                </pre>
              </div>
            </div>
          )}

          {/* Script URL */}
          {installCommandData.scriptUrl && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">{t("admin.forwardAgents.installScript.scriptUrl")}</h4>
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
                        {t("common.copied")}
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 mr-1" />
                        {t("common.copy")}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => safeWindowOpen(installCommandData.scriptUrl)}
                    className="h-7 px-2"
                  >
                    <Download className="size-3.5 mr-1" />
                    {t("common.open")}
                  </Button>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-mono break-all">
                {installCommandData.scriptUrl}
              </div>
            </div>
          )}

          {/* Other info (collapsible) */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <h4 className="text-sm font-medium">{t("admin.forwardAgents.installScript.viewDetails")}</h4>
              <span className="text-xs text-muted-foreground group-open:hidden">{t("admin.forwardAgents.installScript.clickToExpand")}</span>
              <span className="text-xs text-muted-foreground hidden group-open:inline">{t("admin.forwardAgents.installScript.clickToCollapse")}</span>
            </summary>
            <div className="mt-3 space-y-3">
              {/* Server URL */}
              {installCommandData.serverUrl && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium">{t("admin.forwardAgents.installScript.serverUrl")}</h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyServerUrl}
                      className="h-7 px-2"
                    >
                      {copiedServerUrl ? (
                        <>
                          <Check className="size-3.5 mr-1 text-green-500" />
                          {t("common.copied")}
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5 mr-1" />
                          {t("common.copy")}
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-mono break-all">
                    {installCommandData.serverUrl}
                  </div>
                </div>
              )}

              {/* Token */}
              {installCommandData.token && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium">Token</h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyToken}
                      className="h-7 px-2"
                    >
                      {copiedToken ? (
                        <>
                          <Check className="size-3.5 mr-1 text-green-500" />
                          {t("common.copied")}
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5 mr-1" />
                          {t("common.copy")}
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-mono break-all">
                    {installCommandData.token}
                  </div>
                </div>
              )}
            </div>
          </details>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
