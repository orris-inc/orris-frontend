/**
 * Probe Result Dialog Component
 * Displays probe result details for forward rules, including latency and target information
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    if (!rule) return t('admin.forwardRules.probe.target');
    if (rule.targetNodeId) {
      const node = nodes.find((n) => n.id === rule.targetNodeId);
      return node?.name ?? t('admin.forwardRules.probe.target');
    }
    if (rule.targetAddress) {
      return `${rule.targetAddress}:${rule.targetPort}`;
    }
    return t('admin.forwardRules.probe.target');
  };

  // Get entry agent name
  const getEntryAgentName = () => {
    if (!rule?.agentId) return t('admin.forwardRules.probe.entry');
    return getAgentName(rule.agentId);
  };

  // Get exit agent name (for entry type)
  const getExitAgentName = () => {
    if (!rule?.exitAgentId) return t('admin.forwardRules.probe.exit');
    return getAgentName(rule.exitAgentId);
  };

  const targetInfo = getTargetInfo();
  const targetDisplay = getTargetDisplay();
  const entryAgentName = getEntryAgentName();
  const exitAgentName = getExitAgentName();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="@container sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            {t('admin.forwardRules.probe.title')}
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
              <Loader2 className="size-6 animate-spin text-info mb-2" />
              <p className="text-sm text-muted-foreground">{t('admin.forwardRules.probe.probing')}</p>
            </div>
          ) : probeResult ? (
            <div className="space-y-3">
              {/* Probe Status */}
              <div
                className={`flex items-center gap-2.5 p-3 rounded-lg ${
                  probeResult.success
                    ? 'bg-success/10'
                    : 'bg-destructive/10'
                }`}
              >
                {probeResult.success ? (
                  <CheckCircle2 className="size-5 text-success flex-shrink-0" />
                ) : (
                  <XCircle className="size-5 text-destructive flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm font-medium ${
                        probeResult.success
                          ? 'text-success'
                          : 'text-destructive'
                      }`}
                    >
                      {probeResult.success ? t('admin.forwardRules.probe.success') : t('admin.forwardRules.probe.failed')}
                    </p>
                    {probeResult.success && probeResult.totalLatencyMs !== undefined && (
                      <Badge className="font-mono text-xs">{probeResult.totalLatencyMs}ms</Badge>
                    )}
                  </div>
                  {probeResult.error && (
                    <p className="text-xs text-destructive mt-1 break-words">
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
                        <span className="text-xs text-muted-foreground">{t('admin.forwardRules.probe.target')}</span>
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
                        title={t('common.copyAddress')}
                      >
                        {copiedAddress ? (
                          <Check className="size-3 text-success" />
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
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{t('admin.forwardRules.probe.latencyDetails')}</p>
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
                        {/* Multi-exit agent results */}
                        {probeResult.exitAgentResults && probeResult.exitAgentResults.length > 0 ? (
                          probeResult.exitAgentResults.map((exitResult, index) => {
                            const exitName = getAgentName(exitResult.agentId);
                            return (
                              <div key={exitResult.agentId} className="space-y-1">
                                {/* Tunnel latency */}
                                <div className={`flex items-center text-xs py-1 px-2 rounded ${
                                  !exitResult.success ? 'bg-destructive/10' : 'bg-muted/30'
                                }`}>
                                  <span className="text-muted-foreground flex-1 min-w-0 flex items-center gap-1">
                                    <ArrowRight className="size-3 flex-shrink-0" />
                                    <span className="truncate">
                                      {entryAgentName} → {exitName}
                                    </span>
                                    {!exitResult.online && (
                                      <Badge variant="outline" className="text-warning text-[10px] px-1 py-0 flex-shrink-0">
                                        {t('common.status.offline')}
                                      </Badge>
                                    )}
                                    {probeResult.exitAgentResults && probeResult.exitAgentResults.length > 1 && (
                                      <Badge variant="secondary" className="text-[9px] px-1 py-0 flex-shrink-0">
                                        #{index + 1}
                                      </Badge>
                                    )}
                                  </span>
                                  <Badge
                                    variant={exitResult.success ? 'outline' : 'destructive'}
                                    className="font-mono text-[10px] px-1.5 py-0 flex-shrink-0"
                                  >
                                    {exitResult.success && exitResult.tunnelLatencyMs !== undefined
                                      ? `${exitResult.tunnelLatencyMs}ms`
                                      : exitResult.error ?? t('common.status.failed')}
                                  </Badge>
                                </div>
                                {/* Tunnel details (min/max/loss) */}
                                {exitResult.success && (exitResult.tunnelMinLatencyMs !== undefined || exitResult.tunnelPacketLoss !== undefined) && (
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground pl-6">
                                    {exitResult.tunnelMinLatencyMs !== undefined && exitResult.tunnelMaxLatencyMs !== undefined && (
                                      <span>RTT: {exitResult.tunnelMinLatencyMs}-{exitResult.tunnelMaxLatencyMs}ms</span>
                                    )}
                                    {exitResult.tunnelPacketLoss !== undefined && exitResult.tunnelPacketLoss > 0 && (
                                      <span className="text-warning">Loss: {exitResult.tunnelPacketLoss.toFixed(1)}%</span>
                                    )}
                                  </div>
                                )}
                                {/* Target latency */}
                                {exitResult.success && exitResult.targetLatencyMs !== undefined && (
                                  <div className="flex items-center text-xs py-1 px-2 rounded bg-muted/30">
                                    <span className="text-muted-foreground flex-1 min-w-0 flex items-center gap-1">
                                      <ArrowRight className="size-3 flex-shrink-0" />
                                      <span className="truncate">
                                        {exitName} → {targetDisplay}
                                      </span>
                                    </span>
                                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 flex-shrink-0">
                                      {exitResult.targetLatencyMs}ms
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <>
                            {/* Single exit agent (legacy) */}
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
                            {/* Tunnel details for single exit */}
                            {(probeResult.tunnelMinLatencyMs !== undefined || probeResult.tunnelPacketLoss !== undefined) && (
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground pl-6">
                                {probeResult.tunnelMinLatencyMs !== undefined && probeResult.tunnelMaxLatencyMs !== undefined && (
                                  <span>RTT: {probeResult.tunnelMinLatencyMs}-{probeResult.tunnelMaxLatencyMs}ms</span>
                                )}
                                {probeResult.tunnelPacketLoss !== undefined && probeResult.tunnelPacketLoss > 0 && (
                                  <span className="text-warning">Loss: {probeResult.tunnelPacketLoss.toFixed(1)}%</span>
                                )}
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
                              !hop.success ? 'bg-destructive/10' : 'bg-muted/30'
                            }`}
                          >
                            <span className="text-muted-foreground flex-1 min-w-0 flex items-center gap-1">
                              <ArrowRight className="size-3 flex-shrink-0" />
                              <span className="truncate">
                                {fromName} → {toName}
                              </span>
                              {!hop.online && (
                                <Badge variant="outline" className="text-warning text-[10px] px-1 py-0 flex-shrink-0">
                                  {t('common.status.offline')}
                                </Badge>
                              )}
                            </span>
                            <Badge
                              variant={hop.success ? 'outline' : 'destructive'}
                              className="font-mono text-[10px] px-1.5 py-0 flex-shrink-0"
                            >
                              {hop.success ? `${hop.latencyMs}ms` : hop.error ?? t('common.status.failed')}
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">{t('admin.forwardRules.probe.retryHint')}</p>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="w-full @sm:w-auto">
            {t('common.actions.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
