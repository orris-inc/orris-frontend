/**
 * User node detail dialog component
 */

import { Wifi, WifiOff, Clock, Server, Shield, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';
import { Badge } from '@/components/common/Badge';
import { Separator } from '@/components/common/Separator';
import type { UserNode } from '@/api/node';

interface UserNodeDetailDialogProps {
  open: boolean;
  node: UserNode | null;
  onClose: () => void;
}

/**
 * Status badge variant mapping
 */
const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  maintenance: 'outline',
};

const STATUS_LABELS: Record<string, string> = {
  active: '活跃',
  inactive: '停用',
  maintenance: '维护中',
};

/**
 * Format date string to localized format
 */
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export const UserNodeDetailDialog: React.FC<UserNodeDetailDialogProps> = ({
  open,
  node,
  onClose,
}) => {
  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            节点详情
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="space-y-6 py-4">
          {/* Basic info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4" />
              基本信息
            </h3>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <span className="text-muted-foreground">节点名称：</span>
                <span className="font-medium ml-2">{node.name}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">服务器地址：</span>
                <span className="font-mono ml-2">{node.serverAddress}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Agent 端口：</span>
                <span className="font-mono ml-2">{node.agentPort}</span>
              </div>
              <div>
                <span className="text-muted-foreground">订阅端口：</span>
                <span className="font-mono ml-2">
                  {node.subscriptionPort || node.agentPort}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">协议：</span>
                <Badge variant="outline" className="ml-2">
                  {node.protocol === 'shadowsocks' ? 'Shadowsocks' : 'Trojan'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">状态：</span>
                <Badge variant={STATUS_VARIANTS[node.status]} className="ml-2">
                  {STATUS_LABELS[node.status] || node.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Online status */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              {node.isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              )}
              在线状态
            </h3>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">当前状态：</span>
                <span className={`ml-2 ${node.isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {node.isOnline ? '在线' : '离线'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">最后在线：</span>
                <span className="ml-2">{formatDate(node.lastSeenAt)}</span>
              </div>
            </div>
          </div>

          {/* Protocol config */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              协议配置
            </h3>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              {node.protocol === 'shadowsocks' && (
                <>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">加密方法：</span>
                    <span className="font-mono ml-2">{node.encryptionMethod || '-'}</span>
                  </div>
                </>
              )}
              {node.protocol === 'trojan' && (
                <>
                  <div>
                    <span className="text-muted-foreground">传输协议：</span>
                    <span className="ml-2">{node.transportProtocol?.toUpperCase() || 'TCP'}</span>
                  </div>
                  {node.host && (
                    <div>
                      <span className="text-muted-foreground">Host：</span>
                      <span className="font-mono ml-2">{node.host}</span>
                    </div>
                  )}
                  {node.path && (
                    <div>
                      <span className="text-muted-foreground">路径：</span>
                      <span className="font-mono ml-2">{node.path}</span>
                    </div>
                  )}
                  {node.sni && (
                    <div>
                      <span className="text-muted-foreground">SNI：</span>
                      <span className="font-mono ml-2">{node.sni}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">允许不安全 TLS：</span>
                    <span className="ml-2">{node.allowInsecure ? '是' : '否'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Time info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              时间信息
            </h3>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">创建时间：</span>
                <span className="ml-2">{formatDate(node.createdAt)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">更新时间：</span>
                <span className="ml-2">{formatDate(node.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
