/**
 * User node detail dialog component
 */

import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/shared/utils/date-utils';
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

export const UserNodeDetailDialog: React.FC<UserNodeDetailDialogProps> = ({
  open,
  node,
  onClose,
}) => {
  const { t, i18n } = useTranslation();


  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {t('userNodes.detail.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="space-y-6 py-4">
          {/* Basic info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('userNodes.detail.basicInfo')}
            </h3>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <span className="text-muted-foreground">{t('userNodes.detail.nodeName')}</span>
                <span className="font-medium ml-2">{node.name}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">{t('userNodes.detail.serverAddress')}</span>
                <span className="font-mono ml-2">{node.serverAddress}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('userNodes.detail.agentPort')}</span>
                <span className="font-mono ml-2">{node.agentPort}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('userNodes.detail.subscriptionPort')}</span>
                <span className="font-mono ml-2">
                  {node.subscriptionPort || node.agentPort}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('userNodes.detail.protocol')}</span>
                <Badge variant="outline" className="ml-2">
                  {PROTOCOL_NAMES[node.protocol] || node.protocol}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">{t('userNodes.detail.status')}</span>
                <Badge variant={STATUS_VARIANTS[node.status]} className="ml-2">
                  {t(`userNodes.detail.statusLabels.${node.status}`)}
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
              {t('userNodes.detail.onlineStatus')}
            </h3>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('userNodes.detail.currentStatus')}</span>
                <span className={`ml-2 ${node.isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {node.isOnline ? t('common.status.online') : t('common.status.offline')}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('userNodes.detail.lastOnline')}</span>
                <span className="ml-2">{formatDateTime(node.lastSeenAt)}</span>
              </div>
            </div>
          </div>

          {/* Protocol config */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('userNodes.detail.protocolConfig')}
            </h3>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Shadowsocks */}
              {node.protocol === 'shadowsocks' && (
                <>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">{t('userNodes.detail.encryptionMethod')}</span>
                    <span className="font-mono ml-2">{node.encryptionMethod || '-'}</span>
                  </div>
                </>
              )}

              {/* Trojan */}
              {node.protocol === 'trojan' && (
                <>
                  <div>
                    <span className="text-muted-foreground">{t('userNodes.detail.transportProtocol')}</span>
                    <span className="ml-2">{node.transportProtocol?.toUpperCase() || 'TCP'}</span>
                  </div>
                  {node.host && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.host')}</span>
                      <span className="font-mono ml-2">{node.host}</span>
                    </div>
                  )}
                  {node.path && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.path')}</span>
                      <span className="font-mono ml-2">{node.path}</span>
                    </div>
                  )}
                  {node.sni && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.sni')}</span>
                      <span className="font-mono ml-2">{node.sni}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">{t('userNodes.detail.allowInsecure')}</span>
                    <span className="ml-2">{node.allowInsecure ? t('common.yes') : t('common.no')}</span>
                  </div>
                </>
              )}

              {/* VLESS */}
              {node.protocol === 'vless' && (
                <>
                  <div>
                    <span className="text-muted-foreground">{t('userNodes.detail.transportProtocol')}</span>
                    <span className="ml-2">{node.vlessTransportType?.toUpperCase() || 'TCP'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('userNodes.detail.securityType')}</span>
                    <span className="ml-2">{node.vlessSecurity?.toUpperCase() || 'TLS'}</span>
                  </div>
                  {node.vlessFlow && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.flow')}</span>
                      <span className="font-mono ml-2">{node.vlessFlow}</span>
                    </div>
                  )}
                  {node.vlessSni && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.sni')}</span>
                      <span className="font-mono ml-2">{node.vlessSni}</span>
                    </div>
                  )}
                  {node.vlessHost && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.host')}</span>
                      <span className="font-mono ml-2">{node.vlessHost}</span>
                    </div>
                  )}
                  {node.vlessPath && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.path')}</span>
                      <span className="font-mono ml-2">{node.vlessPath}</span>
                    </div>
                  )}
                  {node.vlessServiceName && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.serviceName')}</span>
                      <span className="font-mono ml-2">{node.vlessServiceName}</span>
                    </div>
                  )}
                  {node.vlessSecurity === 'reality' && (
                    <>
                      {node.vlessRealityPublicKey && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">{t('userNodes.detail.realityPublicKey')}</span>
                          <span className="font-mono ml-2 break-all">{node.vlessRealityPublicKey}</span>
                        </div>
                      )}
                      {node.vlessRealityShortId && (
                        <div>
                          <span className="text-muted-foreground">{t('userNodes.detail.realityShortId')}</span>
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
                    <span className="text-muted-foreground">{t('userNodes.detail.transportProtocol')}</span>
                    <span className="ml-2">{node.vmessTransportType?.toUpperCase() || 'TCP'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('userNodes.detail.encryptionType')}</span>
                    <span className="ml-2">{node.vmessSecurity || 'auto'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('userNodes.detail.alterId')}</span>
                    <span className="font-mono ml-2">{node.vmessAlterId ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('userNodes.detail.tls')}</span>
                    <span className="ml-2">{node.vmessTls ? t('userNodes.detail.tlsEnabled') : t('userNodes.detail.tlsDisabled')}</span>
                  </div>
                  {node.vmessSni && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.sni')}</span>
                      <span className="font-mono ml-2">{node.vmessSni}</span>
                    </div>
                  )}
                  {node.vmessHost && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.host')}</span>
                      <span className="font-mono ml-2">{node.vmessHost}</span>
                    </div>
                  )}
                  {node.vmessPath && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.path')}</span>
                      <span className="font-mono ml-2">{node.vmessPath}</span>
                    </div>
                  )}
                  {node.vmessServiceName && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.serviceName')}</span>
                      <span className="font-mono ml-2">{node.vmessServiceName}</span>
                    </div>
                  )}
                </>
              )}

              {/* Hysteria2 */}
              {node.protocol === 'hysteria2' && (
                <>
                  <div>
                    <span className="text-muted-foreground">{t('userNodes.detail.congestionControl')}</span>
                    <span className="ml-2">{node.hysteria2CongestionControl?.toUpperCase() || 'BBR'}</span>
                  </div>
                  {node.hysteria2Sni && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.sni')}</span>
                      <span className="font-mono ml-2">{node.hysteria2Sni}</span>
                    </div>
                  )}
                  {node.hysteria2Obfs && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.obfsType')}</span>
                      <span className="font-mono ml-2">{node.hysteria2Obfs}</span>
                    </div>
                  )}
                  {(node.hysteria2UpMbps || node.hysteria2DownMbps) && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">{t('userNodes.detail.bandwidthLimit')}</span>
                      <span className="ml-2">
                        {t('userNodes.detail.upload')} {node.hysteria2UpMbps || '-'} Mbps / {t('userNodes.detail.download')} {node.hysteria2DownMbps || '-'} Mbps
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">{t('userNodes.detail.allowInsecure')}</span>
                    <span className="ml-2">{node.hysteria2AllowInsecure ? t('common.yes') : t('common.no')}</span>
                  </div>
                </>
              )}

              {/* TUIC */}
              {node.protocol === 'tuic' && (
                <>
                  <div>
                    <span className="text-muted-foreground">{t('userNodes.detail.congestionControl')}</span>
                    <span className="ml-2">{node.tuicCongestionControl?.toUpperCase() || 'BBR'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('userNodes.detail.udpRelayMode')}</span>
                    <span className="ml-2">{node.tuicUdpRelayMode?.toUpperCase() || 'NATIVE'}</span>
                  </div>
                  {node.tuicSni && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.sni')}</span>
                      <span className="font-mono ml-2">{node.tuicSni}</span>
                    </div>
                  )}
                  {node.tuicAlpn && (
                    <div>
                      <span className="text-muted-foreground">{t('userNodes.detail.alpn')}</span>
                      <span className="font-mono ml-2">{node.tuicAlpn}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">{t('userNodes.detail.allowInsecure')}</span>
                    <span className="ml-2">{node.tuicAllowInsecure ? t('common.yes') : t('common.no')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('userNodes.detail.disableSni')}</span>
                    <span className="ml-2">{node.tuicDisableSni ? t('common.yes') : t('common.no')}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Time info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('userNodes.detail.timeInfo')}
            </h3>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('userNodes.detail.createdAt')}</span>
                <span className="ml-2">{formatDateTime(node.createdAt)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('userNodes.detail.updatedAt')}</span>
                <span className="ml-2">{formatDateTime(node.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
