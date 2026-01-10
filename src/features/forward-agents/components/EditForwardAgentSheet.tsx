/**
 * Edit Forward Agent Sheet Component
 * Mobile-optimized bottom sheet for editing forward agents
 */

import { useState, useEffect } from 'react';
import { Cpu, Loader2, Settings, ChevronDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type EditSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Separator } from '@/components/common/Separator';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { MobileFormInput, MobileSelect } from '@/components/common/mobile-form';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { cn } from '@/lib/utils';
import type { ForwardAgent, UpdateForwardAgentRequest, BlockedProtocol } from '@/api/forward';

// Protocol groups
const PROTOCOL_GROUPS: {
  label: string;
  protocols: { value: BlockedProtocol; label: string }[];
}[] = [
  {
    label: '代理协议',
    protocols: [
      { value: 'http_connect', label: 'HTTP CONNECT' },
      { value: 'socks4', label: 'SOCKS4' },
      { value: 'socks5', label: 'SOCKS5' },
    ],
  },
  {
    label: '应用协议',
    protocols: [
      { value: 'http', label: 'HTTP' },
      { value: 'tls', label: 'TLS' },
      { value: 'ssh', label: 'SSH' },
      { value: 'ftp', label: 'FTP' },
    ],
  },
];

interface EditForwardAgentSheetProps extends EditSheetProps<ForwardAgent, UpdateForwardAgentRequest> {}

// Collapsible Section
interface MobileSectionProps {
  title: string;
  icon: React.ElementType;
  badge?: string | null;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const MobileSection: React.FC<MobileSectionProps> = ({
  title,
  icon: Icon,
  badge,
  isOpen,
  onToggle,
  children,
}) => (
  <div className={cn('border rounded-xl overflow-hidden', isOpen ? 'border-primary/30' : 'border-border')}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-left active:bg-accent/30"
    >
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', isOpen ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
          <Icon className="size-4" strokeWidth={1.5} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {badge && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{badge}</Badge>}
        </div>
      </div>
      <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
    </button>
    {isOpen && (
      <div className="px-4 pb-4">
        <Separator className="mb-4" />
        {children}
      </div>
    )}
  </div>
);

export const EditForwardAgentSheet: React.FC<EditForwardAgentSheetProps> = ({
  open,
  onOpenChange,
  entity: agent,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UpdateForwardAgentRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['editable']));
  const [loading, setLoading] = useState(false);

  const { resourceGroups, isLoading: isLoadingGroups } = useResourceGroups({
    pageSize: 100,
    filters: { status: 'active' },
    enabled: open,
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        publicAddress: agent.publicAddress,
        tunnelAddress: agent.tunnelAddress,
        remark: agent.remark,
        allowedPortRange: agent.allowedPortRange,
        sortOrder: agent.sortOrder,
        blockedProtocols: agent.blockedProtocols || [],
        muteNotification: agent.muteNotification,
      });
      setErrors({});
      setOpenSections(new Set(['editable']));
    }
  }, [agent]);

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  const handleChange = (field: keyof UpdateForwardAgentRequest, value: string | number | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleProtocolToggle = (protocol: BlockedProtocol, checked: boolean) => {
    const current = formData.blockedProtocols || [];
    const updated = checked
      ? [...current, protocol]
      : current.filter((p) => p !== protocol);
    setFormData((prev) => ({ ...prev, blockedProtocols: updated }));
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (formData.name !== undefined && !formData.name.trim()) {
      newErrors.name = '节点名称不能为空';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!agent || !validate()) return;

    setLoading(true);
    try {
      const updates: UpdateForwardAgentRequest = {};

      if (formData.name !== agent.name) updates.name = formData.name;
      if (formData.publicAddress !== agent.publicAddress) updates.publicAddress = formData.publicAddress;
      if (formData.tunnelAddress !== agent.tunnelAddress) updates.tunnelAddress = formData.tunnelAddress;
      if (formData.remark !== agent.remark) updates.remark = formData.remark;
      if (formData.allowedPortRange !== agent.allowedPortRange) updates.allowedPortRange = formData.allowedPortRange;
      if (formData.sortOrder !== agent.sortOrder) updates.sortOrder = formData.sortOrder;

      // Compare blocked protocols
      const currentProtocols = agent.blockedProtocols || [];
      const newProtocols = formData.blockedProtocols || [];
      const protocolsChanged =
        currentProtocols.length !== newProtocols.length ||
        currentProtocols.some((p) => !newProtocols.includes(p)) ||
        newProtocols.some((p) => !currentProtocols.includes(p));
      if (protocolsChanged) {
        updates.blockedProtocols = newProtocols;
      }

      if (formData.groupSid !== undefined) {
        updates.groupSid = formData.groupSid;
      }

      if (formData.muteNotification !== agent.muteNotification) {
        updates.muteNotification = formData.muteNotification;
      }

      if (Object.keys(updates).length > 0) {
        await onSubmit(String(agent.id), updates);
      }
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  if (!agent) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Cpu className="size-5 text-primary" />
            </div>
            <span>编辑节点</span>
          </SheetTitle>
          <SheetDescription>
            修改转发节点 {agent.name} 的配置
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4 space-y-3">
          {/* Basic Info (Read-only) */}
          <MobileSection
            title="基本信息"
            icon={Cpu}
            badge="只读"
            isOpen={openSections.has('basic')}
            onToggle={() => toggleSection('basic')}
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground px-1">节点ID</label>
                <MobileFormInput value={String(agent.id)} disabled className="font-mono bg-muted" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground px-1">创建时间</label>
                <MobileFormInput
                  value={new Date(agent.createdAt).toLocaleString('zh-CN')}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </MobileSection>

          {/* Editable Fields */}
          <MobileSection
            title="可编辑信息"
            icon={Settings}
            isOpen={openSections.has('editable')}
            onToggle={() => toggleSection('editable')}
          >
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium px-1">节点名称</label>
                <MobileFormInput
                  value={formData.name || ''}
                  onChange={(value) => handleChange('name', value)}
                  error={errors.name}
                />
              </div>

              {/* Public Address */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium px-1">公网地址</label>
                <MobileFormInput
                  placeholder="example.com 或 1.2.3.4"
                  value={formData.publicAddress || ''}
                  onChange={(value) => handleChange('publicAddress', value)}
                  className="font-mono"
                />
              </div>

              {/* Tunnel Address */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium px-1">隧道地址</label>
                <MobileFormInput
                  placeholder="10.0.0.1"
                  value={formData.tunnelAddress || ''}
                  onChange={(value) => handleChange('tunnelAddress', value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground px-1">
                  用于中继/出口节点的内网连接
                </p>
              </div>

              {/* Allowed Port Range */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium px-1">端口限制</label>
                <MobileFormInput
                  placeholder="80,443,8000-9000"
                  value={formData.allowedPortRange || ''}
                  onChange={(value) => handleChange('allowedPortRange', value)}
                  className="font-mono"
                />
              </div>

              {/* Sort Order */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium px-1">排序顺序</label>
                <MobileFormInput
                  type="number"
                  inputMode="numeric"
                  value={formData.sortOrder !== undefined ? String(formData.sortOrder) : ''}
                  onChange={(value) => handleChange('sortOrder', value ? parseInt(value, 10) : undefined)}
                  className="font-mono"
                />
              </div>

              {/* Blocked Protocols */}
              <div className="space-y-2">
                <label className="text-sm font-medium px-1">阻止协议</label>
                <div className="space-y-3">
                  {PROTOCOL_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="text-xs text-muted-foreground mb-2 px-1">{group.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.protocols.map((protocol) => {
                          const isSelected = formData.blockedProtocols?.includes(protocol.value) || false;
                          return (
                            <button
                              key={protocol.value}
                              type="button"
                              onClick={() => handleProtocolToggle(protocol.value, !isSelected)}
                              className={cn(
                                'px-3 py-2 text-sm rounded-lg border transition-colors min-h-[44px]',
                                isSelected
                                  ? 'bg-destructive/10 border-destructive/50 text-destructive'
                                  : 'bg-muted/50 border-border text-muted-foreground active:bg-muted'
                              )}
                            >
                              {protocol.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remark */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium px-1">备注</label>
                <MobileFormInput
                  placeholder="备注说明"
                  value={formData.remark || ''}
                  onChange={(value) => handleChange('remark', value)}
                />
              </div>

              {/* Resource Group */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium px-1">资源组</label>
                <MobileSelect
                  value={formData.groupSid ?? '__none__'}
                  onChange={(value) => handleChange('groupSid', value === '__none__' ? '' : value)}
                  disabled={isLoadingGroups}
                  options={[
                    { value: '__none__', label: '不关联资源组' },
                    ...resourceGroups.map((group) => ({
                      value: group.sid,
                      label: group.name,
                    })),
                  ]}
                  placeholder={isLoadingGroups ? '加载中...' : '选择资源组'}
                />
              </div>

              {/* Mute Notification */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium px-1">静音通知</label>
                <div className="flex items-center gap-3 min-h-[52px] px-4 rounded-xl border bg-background">
                  <Switch
                    checked={formData.muteNotification ?? false}
                    onCheckedChange={(checked) => handleChange('muteNotification', checked)}
                  >
                    <SwitchThumb />
                  </Switch>
                  <span className="text-sm text-muted-foreground">
                    {formData.muteNotification ? '已静音' : '未静音'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground px-1">
                  开启后将不会发送此节点的上线/下线通知
                </p>
              </div>
            </div>
          </MobileSection>
        </SheetBody>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full min-h-[52px] text-base"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                保存中...
              </>
            ) : '保存'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="w-full min-h-[44px]"
          >
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
