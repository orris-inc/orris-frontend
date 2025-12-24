/**
 * Forward Rule Detail View Dialog
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Separator } from '@/components/common/Separator';
import { TruncatedId } from '@/components/admin';
import type { ForwardRule, ForwardAgent } from '@/api/forward';
import type { Node } from '@/api/node';

interface ForwardRuleDetailDialogProps {
  open: boolean;
  rule: ForwardRule | null;
  onClose: () => void;
  agents?: ForwardAgent[];
  nodes?: Node[];
}

// Status label mapping
const STATUS_LABELS: Record<string, string> = {
  enabled: '已启用',
  disabled: '已禁用',
};

// Protocol type label mapping
const PROTOCOL_LABELS: Record<string, string> = {
  tcp: 'TCP',
  udp: 'UDP',
  both: 'TCP/UDP',
};

// Rule type label mapping
const RULE_TYPE_LABELS: Record<string, string> = {
  direct: '直连转发',
  entry: '入口节点',
  chain: 'WS链式转发',
  direct_chain: '直连链式转发',
};

// IP version label mapping
const IP_VERSION_LABELS: Record<string, string> = {
  auto: '自动',
  ipv4: 'IPv4',
  ipv6: 'IPv6',
};

// Tunnel type label mapping
const TUNNEL_TYPE_LABELS: Record<string, string> = {
  ws: 'WebSocket',
  tls: 'TLS',
};

// Format date
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Format bytes
const formatBytes = (bytes?: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

export const ForwardRuleDetailDialog: React.FC<ForwardRuleDetailDialogProps> = ({
  open,
  rule,
  onClose,
  agents = [],
  nodes = [],
}) => {
  if (!rule) return null;

  // Get agent name by ID
  const getAgentName = (id?: string) => {
    if (!id) return '-';
    const agent = agents.find((a) => a.id === id);
    return agent?.name || `ID: ${id}`;
  };

  const getNodeName = (id?: string) => {
    if (!id) return '-';
    const node = nodes.find((n) => n.id === id);
    return node?.name || `ID: ${id}`;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>转发规则详情</DialogTitle>
            <Badge
              variant={rule.status === 'enabled' ? 'default' : 'secondary'}
            >
              {STATUS_LABELS[rule.status] || rule.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3">基本信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">规则ID</p>
                <TruncatedId id={rule.id} fullWidth />
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">规则名称</p>
                <p className="text-sm">{rule.name}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">规则类型</p>
                <p className="text-sm">{RULE_TYPE_LABELS[rule.ruleType] || rule.ruleType}</p>
              </div>

              {/* Tunnel Type - entry and chain types */}
              {(rule.ruleType === 'entry' || rule.ruleType === 'chain') && rule.tunnelType && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">隧道类型</p>
                  <p className="text-sm">{TUNNEL_TYPE_LABELS[rule.tunnelType] || rule.tunnelType}</p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">转发节点</p>
                <p className="text-sm">{getAgentName(rule.agentId)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">协议类型</p>
                <p className="text-sm">{PROTOCOL_LABELS[rule.protocol] || rule.protocol}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">IP 版本</p>
                <p className="text-sm">{IP_VERSION_LABELS[rule.ipVersion] || rule.ipVersion}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">状态</p>
                <p className="text-sm">{STATUS_LABELS[rule.status] || rule.status}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">排序顺序</p>
                <p className="text-sm">{rule.sortOrder ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Port Configuration */}
          <div>
            <h3 className="text-sm font-semibold mb-3">转发配置</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Listen Port - direct and entry types */}
              {(rule.ruleType === 'direct' || rule.ruleType === 'entry') && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">监听端口</p>
                  <p className="text-sm font-mono">{rule.listenPort}</p>
                </div>
              )}

              {/* Exit Agent - entry type */}
              {rule.ruleType === 'entry' && rule.exitAgentId && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">出口节点</p>
                  <p className="text-sm">{getAgentName(rule.exitAgentId)}</p>
                </div>
              )}

              {/* Intermediate Nodes List - chain and direct_chain types */}
              {(rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && rule.chainAgentIds && rule.chainAgentIds.length > 0 && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm text-muted-foreground">中间节点</p>
                  <div className="flex flex-wrap gap-2">
                    {rule.chainAgentIds.map((agentId, index) => {
                      const portConfig = rule.chainPortConfig?.[agentId];
                      return (
                        <span key={agentId} className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {index + 1}. {getAgentName(agentId)}
                          {rule.ruleType === 'direct_chain' && portConfig && (
                            <span className="text-muted-foreground ml-1">:{portConfig}</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* chain and direct_chain related fields display */}
              {(rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && (
                <>
                  {rule.role && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">节点角色</p>
                      <p className="text-sm">{rule.role === 'entry' ? '入口' : rule.role === 'exit' ? '出口' : rule.role === 'relay' ? '中继' : rule.role}</p>
                    </div>
                  )}
                  {rule.chainPosition !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">链位置</p>
                      <p className="text-sm">{rule.chainPosition + 1}</p>
                    </div>
                  )}
                  {rule.nextHopAgentId && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">下一跳节点</p>
                      <p className="text-sm">{getAgentName(rule.nextHopAgentId)}</p>
                    </div>
                  )}
                  {rule.nextHopAddress && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">下一跳地址</p>
                      <p className="text-sm font-mono">{rule.nextHopAddress}</p>
                    </div>
                  )}
                  {rule.ruleType === 'chain' && rule.nextHopWsPort && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">下一跳 WS 端口</p>
                      <p className="text-sm font-mono">{rule.nextHopWsPort}</p>
                    </div>
                  )}
                  {rule.ruleType === 'chain' && rule.nextHopTlsPort && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">下一跳 TLS 端口</p>
                      <p className="text-sm font-mono">{rule.nextHopTlsPort}</p>
                    </div>
                  )}
                  {rule.ruleType === 'direct_chain' && rule.nextHopPort && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">下一跳端口</p>
                      <p className="text-sm font-mono">{rule.nextHopPort}</p>
                    </div>
                  )}
                  {rule.isLastInChain !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">是否最后节点</p>
                      <p className="text-sm">{rule.isLastInChain ? '是' : '否'}</p>
                    </div>
                  )}
                </>
              )}

              {/* Target Configuration - direct, entry, chain and direct_chain types */}
              {(rule.ruleType === 'direct' || rule.ruleType === 'entry' || rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && (
                <>
                  {rule.targetNodeId ? (
                    <>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">目标节点</p>
                        <p className="text-sm">{getNodeName(rule.targetNodeId)}</p>
                      </div>
                      {rule.targetNodeServerAddress && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">服务器地址</p>
                          <p className="text-sm font-mono">{rule.targetNodeServerAddress}</p>
                        </div>
                      )}
                      {rule.targetNodePublicIpv4 && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">公网 IPv4</p>
                          <p className="text-sm font-mono">{rule.targetNodePublicIpv4}</p>
                        </div>
                      )}
                      {rule.targetNodePublicIpv6 && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">公网 IPv6</p>
                          <p className="text-sm font-mono">{rule.targetNodePublicIpv6}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">目标地址</p>
                        <p className="text-sm font-mono">{rule.targetAddress || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">目标端口</p>
                        <p className="text-sm font-mono">{rule.targetPort || '-'}</p>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Bind IP */}
              {rule.bindIp && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">绑定 IP</p>
                  <p className="text-sm font-mono">{rule.bindIp}</p>
                </div>
              )}
            </div>
          </div>

          {/* Traffic Statistics */}
          <div>
            <h3 className="text-sm font-semibold mb-3">流量统计</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">上传流量</p>
                <p className="text-sm">{formatBytes(rule.uploadBytes)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">下载流量</p>
                <p className="text-sm">{formatBytes(rule.downloadBytes)}</p>
              </div>

              <div className="space-y-1 md:col-span-2">
                <p className="text-sm text-muted-foreground">总流量</p>
                <p className="text-sm">
                  {formatBytes((rule.uploadBytes || 0) + (rule.downloadBytes || 0))}
                </p>
              </div>

              {rule.effectiveTrafficMultiplier !== undefined && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">流量倍率</p>
                  <p className="text-sm">{rule.effectiveTrafficMultiplier.toFixed(2)} 倍</p>
                </div>
              )}

              {rule.nodeCount !== undefined && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">节点数量</p>
                  <p className="text-sm">{rule.nodeCount}</p>
                </div>
              )}

              {rule.isAutoMultiplier !== undefined && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm text-muted-foreground">倍率类型</p>
                  <p className="text-sm">
                    {rule.isAutoMultiplier ? '自动计算' : '自定义'}
                    {!rule.isAutoMultiplier && rule.trafficMultiplier !== undefined && (
                      <span className="text-muted-foreground ml-2">
                        (自定义值: {rule.trafficMultiplier.toFixed(2)} 倍)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Other Information */}
          {rule.remark && (
            <div>
              <h3 className="text-sm font-semibold mb-3">其他信息</h3>
              <Separator className="mb-4" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">备注</p>
                <p className="text-sm">{rule.remark}</p>
              </div>
            </div>
          )}

          {/* Time Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3">时间信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">创建时间</p>
                <p className="text-xs">{formatDate(rule.createdAt)}</p>
              </div>

              {rule.updatedAt && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">更新时间</p>
                  <p className="text-xs">{formatDate(rule.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
