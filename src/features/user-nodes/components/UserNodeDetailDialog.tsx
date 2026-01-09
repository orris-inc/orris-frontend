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
import type { UserNode, NodeProtocol } from '@/api/node';

interface UserNodeDetailDialogProps {
  open: boolean;
  node: UserNode | null;
  onClose: () => void;
}

/**
 * Protocol display names
 */
const PROTOCOL_NAMES: Record<NodeProtocol, string> = {
  shadowsocks: 'Shadowsocks',
  trojan: 'Trojan',
  vless: 'VLESS',
  vmess: 'VMess',
  hysteria2: 'Hysteria2',
  tuic: 'TUIC',
};

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
                  {PROTOCOL_NAMES[node.protocol] || node.protocol}
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
              {/* Shadowsocks */}
              {node.protocol === 'shadowsocks' && (
                <>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">加密方法：</span>
                    <span className="font-mono ml-2">{node.encryptionMethod || '-'}</span>
                  </div>
                </>
              )}

              {/* Trojan */}
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

              {/* VLESS */}
              {node.protocol === 'vless' && (
                <>
                  <div>
                    <span className="text-muted-foreground">传输协议：</span>
                    <span className="ml-2">{node.vlessTransportType?.toUpperCase() || 'TCP'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">安全类型：</span>
                    <span className="ml-2">{node.vlessSecurity?.toUpperCase() || 'TLS'}</span>
                  </div>
                  {node.vlessFlow && (
                    <div>
                      <span className="text-muted-foreground">Flow：</span>
                      <span className="font-mono ml-2">{node.vlessFlow}</span>
                    </div>
                  )}
                  {node.vlessSni && (
                    <div>
                      <span className="text-muted-foreground">SNI：</span>
                      <span className="font-mono ml-2">{node.vlessSni}</span>
                    </div>
                  )}
                  {node.vlessHost && (
                    <div>
                      <span className="text-muted-foreground">Host：</span>
                      <span className="font-mono ml-2">{node.vlessHost}</span>
                    </div>
                  )}
                  {node.vlessPath && (
                    <div>
                      <span className="text-muted-foreground">路径：</span>
                      <span className="font-mono ml-2">{node.vlessPath}</span>
                    </div>
                  )}
                  {node.vlessServiceName && (
                    <div>
                      <span className="text-muted-foreground">Service Name：</span>
                      <span className="font-mono ml-2">{node.vlessServiceName}</span>
                    </div>
                  )}
                  {node.vlessSecurity === 'reality' && (
                    <>
                      {node.vlessRealityPublicKey && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Reality Public Key：</span>
                          <span className="font-mono ml-2 break-all">{node.vlessRealityPublicKey}</span>
                        </div>
                      )}
                      {node.vlessRealityShortId && (
                        <div>
                          <span className="text-muted-foreground">Reality Short ID：</span>
                          <span className="font-mono ml-2">{node.vlessRealityShortId}</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* VMess */}
              {node.protocol === 'vmess' && (
                <>
                  <div>
                    <span className="text-muted-foreground">传输协议：</span>
                    <span className="ml-2">{node.vmessTransportType?.toUpperCase() || 'TCP'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">加密方式：</span>
                    <span className="ml-2">{node.vmessSecurity || 'auto'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Alter ID：</span>
                    <span className="font-mono ml-2">{node.vmessAlterId ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">TLS：</span>
                    <span className="ml-2">{node.vmessTls ? '启用' : '未启用'}</span>
                  </div>
                  {node.vmessSni && (
                    <div>
                      <span className="text-muted-foreground">SNI：</span>
                      <span className="font-mono ml-2">{node.vmessSni}</span>
                    </div>
                  )}
                  {node.vmessHost && (
                    <div>
                      <span className="text-muted-foreground">Host：</span>
                      <span className="font-mono ml-2">{node.vmessHost}</span>
                    </div>
                  )}
                  {node.vmessPath && (
                    <div>
                      <span className="text-muted-foreground">路径：</span>
                      <span className="font-mono ml-2">{node.vmessPath}</span>
                    </div>
                  )}
                  {node.vmessServiceName && (
                    <div>
                      <span className="text-muted-foreground">Service Name：</span>
                      <span className="font-mono ml-2">{node.vmessServiceName}</span>
                    </div>
                  )}
                </>
              )}

              {/* Hysteria2 */}
              {node.protocol === 'hysteria2' && (
                <>
                  <div>
                    <span className="text-muted-foreground">拥塞控制：</span>
                    <span className="ml-2">{node.hysteria2CongestionControl?.toUpperCase() || 'BBR'}</span>
                  </div>
                  {node.hysteria2Sni && (
                    <div>
                      <span className="text-muted-foreground">SNI：</span>
                      <span className="font-mono ml-2">{node.hysteria2Sni}</span>
                    </div>
                  )}
                  {node.hysteria2Obfs && (
                    <div>
                      <span className="text-muted-foreground">Obfs 类型：</span>
                      <span className="font-mono ml-2">{node.hysteria2Obfs}</span>
                    </div>
                  )}
                  {(node.hysteria2UpMbps || node.hysteria2DownMbps) && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">带宽限制：</span>
                      <span className="ml-2">
                        上行 {node.hysteria2UpMbps || '-'} Mbps / 下行 {node.hysteria2DownMbps || '-'} Mbps
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">允许不安全 TLS：</span>
                    <span className="ml-2">{node.hysteria2AllowInsecure ? '是' : '否'}</span>
                  </div>
                </>
              )}

              {/* TUIC */}
              {node.protocol === 'tuic' && (
                <>
                  <div>
                    <span className="text-muted-foreground">拥塞控制：</span>
                    <span className="ml-2">{node.tuicCongestionControl?.toUpperCase() || 'BBR'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">UDP 中继模式：</span>
                    <span className="ml-2">{node.tuicUdpRelayMode?.toUpperCase() || 'NATIVE'}</span>
                  </div>
                  {node.tuicSni && (
                    <div>
                      <span className="text-muted-foreground">SNI：</span>
                      <span className="font-mono ml-2">{node.tuicSni}</span>
                    </div>
                  )}
                  {node.tuicAlpn && (
                    <div>
                      <span className="text-muted-foreground">ALPN：</span>
                      <span className="font-mono ml-2">{node.tuicAlpn}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">允许不安全 TLS：</span>
                    <span className="ml-2">{node.tuicAllowInsecure ? '是' : '否'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">禁用 SNI：</span>
                    <span className="ml-2">{node.tuicDisableSni ? '是' : '否'}</span>
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
