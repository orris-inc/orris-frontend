/**
 * MobileForwardAgentCard - iOS 26 Liquid Glass styled forward agent card for mobile
 *
 * Designed following iOS Human Interface Guidelines:
 * - Minimum 44px touch targets for all interactive elements
 * - Clear visual hierarchy with primary/secondary information
 * - Expandable details section with smooth animation
 * - Quick action buttons for common operations
 * - Respects prefers-reduced-motion
 */

import { useState } from 'react';
import {
  ChevronDown,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Terminal,
  Copy,
  Key,
  Network,
  Hash,
  Calendar,
  FileText,
  Download,
  Loader2,
  ArrowUpCircle,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/common/Collapsible';
import { AdminBadge } from '@/components/admin';
import { SystemStatusDisplay } from '@/components/common/SystemStatusDisplay';
import { MobileActionButton } from '@/components/mobile';
import { cn } from '@/lib/utils';
import { formatDate } from '@/shared/utils/date-utils';
import { formatBitRate, formatBytes } from '@/shared/utils/format-utils';
import { ENABLED_STATUS_CONFIG_SHORT } from '@/shared/constants/status-config';
import type { ForwardAgent } from '@/api/forward';

// ============================================================================
// Types
// ============================================================================

export interface MobileForwardAgentCardProps {
  agent: ForwardAgent;
  onEdit: (agent: ForwardAgent) => void;
  onDelete: (agent: ForwardAgent) => void;
  onEnable: (agent: ForwardAgent) => void;
  onDisable: (agent: ForwardAgent) => void;
  onGetInstallScript: (agent: ForwardAgent) => void;
  onCopy: (agent: ForwardAgent) => void;
  onRegenerateToken: (agent: ForwardAgent) => void;
  onCheckUpdate?: (agent: ForwardAgent) => void;
  checkingAgentId?: string | number | null;
}

// ============================================================================
// Main Component
// ============================================================================

export const MobileForwardAgentCard = ({
  agent,
  onEdit,
  onDelete,
  onEnable,
  onDisable,
  onGetInstallScript,
  onCopy,
  onRegenerateToken,
  onCheckUpdate,
  checkingAgentId,
}: MobileForwardAgentCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = ENABLED_STATUS_CONFIG_SHORT[agent.status] || {
    label: agent.status,
    variant: 'default' as const,
  };

  const isChecking = checkingAgentId === agent.id;

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className={cn(
        'bg-card/60 backdrop-blur-sm',
        'rounded-2xl',
        'border border-border/50',
        'overflow-hidden'
      )}
    >
      {/* Header - Always visible */}
      <CollapsibleTrigger
        className={cn(
          'w-full px-4 py-3 min-h-[60px]',
          'flex items-center justify-between gap-3',
          'text-left cursor-pointer',
          // Active feedback
          'motion-safe:active:bg-foreground/5'
        )}
      >
        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-foreground truncate">
              {agent.name}
            </span>
            <AdminBadge
              variant={statusConfig.variant}
              className="text-[10px] px-1.5 py-0 shrink-0"
            >
              {statusConfig.label}
            </AdminBadge>
            {/* Online status indicator */}
            {agent.isOnline ? (
              <span className="inline-flex items-center gap-1 text-success shrink-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/60 opacity-75 motion-reduce:animate-none"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
                </span>
                <span className="text-[10px] font-medium">在线</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"></span>
                <span className="text-[10px]">离线</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Network className="size-3 shrink-0" />
            <span className="truncate font-mono">
              {agent.publicAddress || '-'}
            </span>
            {agent.hasUpdate && (
              <>
                <span className="text-border">·</span>
                <span className="flex items-center gap-0.5 text-warning shrink-0">
                  <ArrowUpCircle className="size-3" />
                  <span className="text-[10px]">可更新</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            'size-5 text-muted-foreground shrink-0',
            'transition-transform duration-200',
            'motion-reduce:transition-none',
            isExpanded && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>

      {/* Expandable Details */}
      <CollapsibleContent>
        {/* Details Section */}
        <div className="border-t border-border/30 px-4 py-3 space-y-2.5">
          {/* ID */}
          <div className="flex items-center gap-3">
            <Hash className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                ID
              </div>
              <div className="text-xs font-mono text-foreground truncate">
                {agent.id}
              </div>
            </div>
          </div>

          {/* Public Address */}
          <div className="flex items-center gap-3">
            <Network className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                公网地址
              </div>
              <div className="text-xs font-mono text-foreground truncate">
                {agent.publicAddress || '-'}
              </div>
            </div>
          </div>

          {/* Tunnel Address */}
          {agent.tunnelAddress && (
            <div className="flex items-center gap-3">
              <Network className="size-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                  隧道地址
                </div>
                <div className="text-xs font-mono text-foreground truncate">
                  {agent.tunnelAddress}
                </div>
              </div>
            </div>
          )}

          {/* System Status */}
          {agent.systemStatus && (
            <div className="flex items-start gap-3">
              <div className="size-4 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  系统状态
                </div>
                <div className="flex flex-col gap-1.5">
                  {/* System bars + Network rates */}
                  <div className="flex items-center gap-3">
                    <SystemStatusDisplay
                      status={{
                        cpu: agent.systemStatus.cpuPercent,
                        memory: agent.systemStatus.memoryPercent,
                        disk: agent.systemStatus.diskPercent,
                        uptime: agent.systemStatus.uptimeSeconds,
                        memoryUsed: agent.systemStatus.memoryUsed,
                        memoryTotal: agent.systemStatus.memoryTotal,
                        memoryAvail: agent.systemStatus.memoryAvail,
                        diskUsed: agent.systemStatus.diskUsed,
                        diskTotal: agent.systemStatus.diskTotal,
                        loadAvg1: agent.systemStatus.loadAvg1,
                        loadAvg5: agent.systemStatus.loadAvg5,
                        loadAvg15: agent.systemStatus.loadAvg15,
                      }}
                    />
                    {/* Network rates */}
                    <div className="w-px h-4 bg-border/50" />
                    <div className="flex items-center gap-1.5 text-[10px] font-mono">
                      <span className="text-success">
                        ↓{formatBitRate(agent.systemStatus.networkRxRate, true)}
                      </span>
                      <span className="text-info">
                        ↑{formatBitRate(agent.systemStatus.networkTxRate, true)}
                      </span>
                    </div>
                  </div>
                  {/* Extended info row */}
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="font-mono">
                      累计: ↓{formatBytes(agent.systemStatus.networkRxBytes)} ↑
                      {formatBytes(agent.systemStatus.networkTxBytes)}
                    </span>
                    <span>
                      {(agent.systemStatus.tcpConnections || 0) +
                        (agent.systemStatus.udpConnections || 0)}{' '}
                      连接
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Version */}
          {agent.agentVersion && (
            <div className="flex items-center gap-3">
              <Download className="size-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                  版本
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'text-xs font-mono',
                      agent.hasUpdate ? 'text-warning' : 'text-foreground'
                    )}
                  >
                    v{agent.agentVersion}
                    {agent.systemStatus?.platform &&
                      agent.systemStatus?.arch && (
                        <span className="text-muted-foreground ml-1">
                          ({agent.systemStatus.platform}/
                          {agent.systemStatus.arch})
                        </span>
                      )}
                  </span>
                  {agent.hasUpdate && (
                    <AdminBadge variant="warning" className="text-[10px] px-1.5 py-0">
                      可更新
                    </AdminBadge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Remark */}
          {agent.remark && (
            <div className="flex items-start gap-3">
              <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                  备注
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {agent.remark}
                </div>
              </div>
            </div>
          )}

          {/* Created At */}
          <div className="flex items-center gap-3">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                创建时间
              </div>
              <div className="text-xs text-foreground">
                {formatDate(agent.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="border-t border-border/30 px-4 py-3">
          <div className="flex gap-1.5 flex-wrap">
            <MobileActionButton
              icon={<Edit className="size-3.5" />}
              label="编辑"
              onClick={() => onEdit(agent)}
              variant="primary"
            />
            <MobileActionButton
              icon={<Terminal className="size-3.5" />}
              label="脚本"
              onClick={() => onGetInstallScript(agent)}
            />
            <MobileActionButton
              icon={<Copy className="size-3.5" />}
              label="复制"
              onClick={() => onCopy(agent)}
            />
            <MobileActionButton
              icon={<Key className="size-3.5" />}
              label="Token"
              onClick={() => onRegenerateToken(agent)}
            />
            {onCheckUpdate && agent.status === 'enabled' && (
              <MobileActionButton
                icon={
                  isChecking ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" />
                  )
                }
                label={isChecking ? '检查中' : '更新'}
                onClick={() => onCheckUpdate(agent)}
                disabled={isChecking}
              />
            )}
            <MobileActionButton
              icon={
                agent.status === 'enabled' ? (
                  <PowerOff className="size-3.5" />
                ) : (
                  <Power className="size-3.5" />
                )
              }
              label={agent.status === 'enabled' ? '禁用' : '启用'}
              onClick={() =>
                agent.status === 'enabled' ? onDisable(agent) : onEnable(agent)
              }
            />
            <MobileActionButton
              icon={<Trash2 className="size-3.5" />}
              label="删除"
              onClick={() => onDelete(agent)}
              variant="destructive"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

MobileForwardAgentCard.displayName = 'MobileForwardAgentCard';
