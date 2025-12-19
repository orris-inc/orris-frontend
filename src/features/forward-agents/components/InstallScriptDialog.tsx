/**
 * 安装脚本对话框组件
 * 显示 Agent 安装脚本和一键安装命令
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
            安装命令
          </DialogTitle>
          <DialogDescription>
            {agentName ? `节点 "${agentName}" 的` : ''}安装命令，在目标服务器上执行即可完成部署
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 安装命令（主要） */}
          {installCommandData.installCommand && (
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
                  {installCommandData.installCommand}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                在目标服务器上以 root 权限执行此命令，将自动下载并安装 Agent
              </p>
            </div>
          )}

          {/* 卸载命令 */}
          {installCommandData.uninstallCommand && (
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
                  {installCommandData.uninstallCommand}
                </pre>
              </div>
            </div>
          )}

          {/* 脚本地址 */}
          {installCommandData.scriptUrl && (
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
                    onClick={() => window.open(installCommandData.scriptUrl, '_blank')}
                    className="h-7 px-2"
                  >
                    <Download className="size-3.5 mr-1" />
                    打开
                  </Button>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-mono break-all">
                {installCommandData.scriptUrl}
              </div>
            </div>
          )}

          {/* 其他信息（可折叠） */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <h4 className="text-sm font-medium">查看详细信息</h4>
              <span className="text-xs text-muted-foreground group-open:hidden">点击展开</span>
              <span className="text-xs text-muted-foreground hidden group-open:inline">点击收起</span>
            </summary>
            <div className="mt-3 space-y-3">
              {/* Server URL */}
              {installCommandData.serverUrl && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium">服务器地址</h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyServerUrl}
                      className="h-7 px-2"
                    >
                      {copiedServerUrl ? (
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
                    {installCommandData.token}
                  </div>
                </div>
              )}
            </div>
          </details>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
