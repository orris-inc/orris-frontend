/**
 * User node install script dialog component
 * Displays install script and one-click install command
 */

import { useState } from 'react';
import { Copy, Check, Terminal, Download } from 'lucide-react';
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
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="size-5" />
            安装命令
          </DialogTitle>
          <DialogDescription>
            {nodeName ? `节点「${nodeName}」的` : ''}安装命令，在目标服务器上执行即可完成部署
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            加载中...
          </div>
        ) : !installScriptData ? (
          <div className="py-8 text-center text-muted-foreground">
            暂无安装脚本数据
          </div>
        ) : (
          <div className="space-y-4">
            {/* Install command (main) */}
            {installScriptData.installCommand && (
              <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    安装命令
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">推荐</span>
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
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 mr-1" />
                        复制
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
                  在目标服务器上以 root 权限执行此命令，将自动下载并安装节点
                </p>
              </div>
            )}

            {/* Uninstall command */}
            {installScriptData.uninstallCommand && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">卸载命令</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyUninstall}
                    className="h-7 px-2"
                  >
                    {copiedUninstall ? (
                      <>
                        <Check className="size-3.5 mr-1 text-green-500" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 mr-1" />
                        复制
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
                  <h4 className="text-sm font-medium">脚本地址</h4>
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
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5 mr-1" />
                          复制
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(installScriptData.scriptUrl, '_blank')}
                      className="h-7 px-2"
                    >
                      <Download className="size-3.5 mr-1" />
                      打开
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
                <h4 className="text-sm font-medium">查看详细信息</h4>
                <span className="text-xs text-muted-foreground group-open:hidden">点击展开</span>
                <span className="text-xs text-muted-foreground hidden group-open:inline">点击收起</span>
              </summary>
              <div className="mt-3 space-y-3">
                {/* API URL */}
                {installScriptData.apiUrl && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium">API 地址</h5>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyApiUrl}
                        className="h-7 px-2"
                      >
                        {copiedApiUrl ? (
                          <>
                            <Check className="size-3.5 mr-1 text-green-500" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5 mr-1" />
                            复制
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
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5 mr-1" />
                            复制
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
