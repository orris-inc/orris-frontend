/**
 * Probe Result Dialog Component
 * Displays probe result details for forward rules, including latency and target information
 */

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import type { ForwardRule, ForwardAgent, RuleProbeResponse, ChainHopLatency } from '@/api/forward';
import type { Node } from '@/api/node';

interface ProbeResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: ForwardRule | null;
  probeResult: RuleProbeResponse | null;
  isProbing: boolean;
  agents: ForwardAgent[];
  nodes: Node[];
}

export const ProbeResultDialog: React.FC<ProbeResultDialogProps> = ({
  open,
  onOpenChange,
  rule,
  probeResult,
  isProbing,
  agents,
  nodes,
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Get agent name
  const getAgentName = (id: string) => {
    const agent = agents.find((a) => a.id === id);
    return agent?.name ?? id.replace('fa_', '');
  };

  // Get target display information
  const getTargetInfo = () => {
    if (!rule) return null;

    if (rule.targetNodeId) {
      const node = nodes.find((n) => n.id === rule.targetNodeId);
      const nodeName = node?.name ?? rule.targetNodeId;
      const ip =
        rule.ipVersion === 'ipv4'
          ? rule.targetNodePublicIpv4
          : rule.ipVersion === 'ipv6'
            ? rule.targetNodePublicIpv6
            : rule.targetNodeServerAddress ?? rule.targetNodePublicIpv4 ?? rule.targetNodePublicIpv6;
      return { type: 'node' as const, name: nodeName, ip, port: rule.targetPort };
    }

    if (rule.targetAddress) {
      return { type: 'manual' as const, name: null, ip: rule.targetAddress, port: rule.targetPort };
    }

    return null;
  };

  // Get target display name
  const getTargetDisplay = () => {
    if (!rule) return '目标';
    if (rule.targetNodeId) {
      const node = nodes.find((n) => n.id === rule.targetNodeId);
      return node?.name ?? '目标';
    }
    if (rule.targetAddress) {
      return `${rule.targetAddress}:${rule.targetPort}`;
    }
    return '目标';
  };

  // Get entry agent name
  const getEntryAgentName = () => {
    if (!rule?.agentId) return '入口';
    return getAgentName(rule.agentId);
  };

  // Get exit agent name (for entry type)
  const getExitAgentName = () => {
    if (!rule?.exitAgentId) return '出口';
    return getAgentName(rule.exitAgentId);
  };

  const targetInfo = getTargetInfo();
  const targetDisplay = getTargetDisplay();
  const entryAgentName = getEntryAgentName();
  const exitAgentName = getExitAgentName();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            拨测结果
            {probeResult && (
              <Badge variant={probeResult.success ? 'default' : 'destructive'} className="text-xs">
                {probeResult.ruleType}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto py-3">
          {isProbing ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="size-6 animate-spin text-blue-500 mb-2" />
              <p className="text-sm text-muted-foreground">正在拨测...</p>
            </div>
          ) : probeResult ? (
            <div className="space-y-3">
              {/* Probe Status */}
              <div
                className={`flex items-center gap-2.5 p-3 rounded-lg ${
                  probeResult.success
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}
              >
                {probeResult.success ? (
                  <CheckCircle2 className="size-5 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="size-5 text-red-500 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm font-medium ${
                        probeResult.success
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}
                    >
                      {probeResult.success ? '拨测成功' : '拨测失败'}
                    </p>
                    {probeResult.success && probeResult.totalLatencyMs !== undefined && (
                      <Badge className="font-mono text-xs">{probeResult.totalLatencyMs}ms</Badge>
                    )}
                  </div>
                  {probeResult.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 break-words">
                      {probeResult.error}
                    </p>
                  )}
                </div>
              </div>

              {/* Target Information - Display for all types */}
              {rule && targetInfo && (
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Globe className="size-3.5 text-muted-foreground flex-shrink-0" />
                      {targetInfo.name ? (
                        <span className="text-xs font-medium truncate">{targetInfo.name}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">目标</span>
                      )}
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {rule.ipVersion}
                      </Badge>
                    </div>
                    {targetInfo.ip && (
                      <button
                        type="button"
                        onClick={() => {
                          const address = `${targetInfo.ip}${targetInfo.port ? `:${targetInfo.port}` : ''}`;
                          navigator.clipboard.writeText(address);
                          setCopiedAddress(true);
                          setTimeout(() => setCopiedAddress(false), 2000);
                        }}
                        className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                        title="复制地址"
                      >
                        {copiedAddress ? (
                          <Check className="size-3 text-green-500" />
                        ) : (
                          <Copy className="size-3 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </div>
                  {targetInfo.ip && (
                    <code className="font-mono text-xs text-muted-foreground mt-1 block truncate">
                      {targetInfo.ip}{targetInfo.port ? `:${targetInfo.port}` : ''}
                    </code>
                  )}
                </div>
              )}

              {/* Latency Information */}
              {probeResult.success && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">延迟详情</p>
                  <div className="space-y-1">
                    {/* direct type: entry → target */}
                    {probeResult.ruleType === 'direct' &&
                      probeResult.targetLatencyMs !== undefined && (
                        <div className="flex items-center text-xs py-1 px-2 rounded bg-muted/30">
                          <span className="text-muted-foreground flex-1 min-w-0 flex items-center gap-1">
                            <ArrowRight className="size-3 flex-shrink-0" />
                            <span className="truncate">
                              {entryAgentName} → {targetDisplay}
                            </span>
                          </span>
                          <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 flex-shrink-0">
                            {probeResult.targetLatencyMs}ms
                          </Badge>
                        </div>
                      )}

                    {/* entry type: entry → exit → target */}
                    {probeResult.ruleType === 'entry' && (
                      <>
                        {probeResult.tunnelLatencyMs !== undefined && (
                          <div className="flex items-center text-xs py-1 px-2 rounded bg-muted/30">
                            <span className="text-muted-foreground flex-1 min-w-0 flex items-center gap-1">
                              <ArrowRight className="size-3 flex-shrink-0" />
                              <span className="truncate">
                                {entryAgentName} → {exitAgentName}
                              </span>
                            </span>
                            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 flex-shrink-0">
                              {probeResult.tunnelLatencyMs}ms
                            </Badge>
                          </div>
                        )}
                        {probeResult.targetLatencyMs !== undefined && (
                          <div className="flex items-center text-xs py-1 px-2 rounded bg-muted/30">
                            <span className="text-muted-foreground flex-1 min-w-0 flex items-center gap-1">
                              <ArrowRight className="size-3 flex-shrink-0" />
                              <span className="truncate">
                                {exitAgentName} → {targetDisplay}
                              </span>
                            </span>
                            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 flex-shrink-0">
                              {probeResult.targetLatencyMs}ms
                            </Badge>
                          </div>
                        )}
                      </>
                    )}

                    {/* chain/direct_chain types: latency for each hop in the chain */}
                    {(probeResult.ruleType === 'chain' || probeResult.ruleType === 'direct_chain') &&
                      probeResult.chainLatencies &&
                      probeResult.chainLatencies.length > 0 &&
                      probeResult.chainLatencies.map((hop: ChainHopLatency, index: number) => {
                        const fromName = getAgentName(hop.from);
                        const toName = hop.to === 'target' ? targetDisplay : getAgentName(hop.to);
                        return (
                          <div
                            key={index}
                            className={`flex items-center text-xs py-1 px-2 rounded ${
                              !hop.success ? 'bg-red-50 dark:bg-red-900/20' : 'bg-muted/30'
                            }`}
                          >
                            <span className="text-muted-foreground flex-1 min-w-0 flex items-center gap-1">
                              <ArrowRight className="size-3 flex-shrink-0" />
                              <span className="truncate">
                                {fromName} → {toName}
                              </span>
                              {!hop.online && (
                                <Badge variant="outline" className="text-yellow-600 text-[10px] px-1 py-0 flex-shrink-0">
                                  离线
                                </Badge>
                              )}
                            </span>
                            <Badge
                              variant={hop.success ? 'outline' : 'destructive'}
                              className="font-mono text-[10px] px-1.5 py-0 flex-shrink-0"
                            >
                              {hop.success ? `${hop.latencyMs}ms` : hop.error ?? '失败'}
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">拨测失败，请重试</p>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
