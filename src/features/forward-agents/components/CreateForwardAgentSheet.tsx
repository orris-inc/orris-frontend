/**
 * Create Forward Agent Sheet Component
 * Mobile-optimized bottom sheet for creating forward agents
 */

import { useState, useEffect } from 'react';
import { Cpu, Loader2, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type CreateSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { MobileFormInput } from '@/components/common/mobile-form';
import { cn } from '@/lib/utils';
import type { CreateForwardAgentRequest, BlockedProtocol } from '@/api/forward';

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

interface CreateForwardAgentSheetProps extends CreateSheetProps<CreateForwardAgentRequest> {
  initialData?: Partial<CreateForwardAgentRequest>;
}

const getDefaultFormData = (): CreateForwardAgentRequest => ({
  name: '',
  publicAddress: '',
  tunnelAddress: '',
  remark: '',
  allowedPortRange: '',
  sortOrder: undefined,
  blockedProtocols: [],
});

export const CreateForwardAgentSheet: React.FC<CreateForwardAgentSheetProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<CreateForwardAgentRequest>(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      setFormData({ ...getDefaultFormData(), ...initialData });
    } else if (open && !initialData) {
      setFormData(getDefaultFormData());
    }
  }, [open, initialData]);

  const handleClose = () => {
    if (!loading) {
      setFormData(getDefaultFormData());
      setErrors({});
      onOpenChange(false);
    }
  };

  const handleChange = (field: keyof CreateForwardAgentRequest, value: string | number | undefined) => {
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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '节点名称不能为空';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const submitData: CreateForwardAgentRequest = {
        name: formData.name.trim(),
      };

      if (formData.publicAddress?.trim()) {
        submitData.publicAddress = formData.publicAddress.trim();
      }
      if (formData.tunnelAddress?.trim()) {
        submitData.tunnelAddress = formData.tunnelAddress.trim();
      }
      if (formData.remark?.trim()) {
        submitData.remark = formData.remark.trim();
      }
      if (formData.allowedPortRange?.trim()) {
        submitData.allowedPortRange = formData.allowedPortRange.trim();
      }
      if (formData.sortOrder !== undefined) {
        submitData.sortOrder = formData.sortOrder;
      }
      if (formData.blockedProtocols && formData.blockedProtocols.length > 0) {
        submitData.blockedProtocols = formData.blockedProtocols;
      }

      await onSubmit(submitData);
      setFormData(getDefaultFormData());
      setErrors({});
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name.trim();

  return (
    <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)} repositionInputs>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Cpu className="size-5 text-primary" />
            </div>
            <span>{initialData ? '复制节点' : '新增节点'}</span>
          </SheetTitle>
          <SheetDescription>
            创建新的转发节点，用于管理端口转发规则
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4 py-4">
          {/* Node Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium px-1">
              节点名称 <span className="text-destructive">*</span>
            </label>
            <MobileFormInput
              placeholder="例如：主转发节点"
              value={formData.name}
              onChange={(value) => handleChange('name', value)}
              error={errors.name}
              icon={<Cpu className="size-5" />}
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
            <p className="text-xs text-muted-foreground px-1">
              可选，留空时由 Agent 自动检测
            </p>
          </div>

          {/* Tunnel Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium px-1">隧道地址</label>
            <MobileFormInput
              placeholder="10.0.0.1 或 internal.example.com"
              value={formData.tunnelAddress || ''}
              onChange={(value) => handleChange('tunnelAddress', value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground px-1">
              可选，用于中继/出口节点的内网连接
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
            <p className="text-xs text-muted-foreground px-1">
              可选，留空表示允许所有端口
            </p>
          </div>

          {/* Sort Order */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium px-1">排序顺序</label>
            <MobileFormInput
              type="number"
              inputMode="numeric"
              placeholder="100"
              value={formData.sortOrder !== undefined ? String(formData.sortOrder) : ''}
              onChange={(value) => handleChange('sortOrder', value ? parseInt(value, 10) : undefined)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground px-1">
              数值越小排序越靠前
            </p>
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
            <p className="text-xs text-muted-foreground px-1">
              可选，点击选择需要阻止的协议类型
            </p>
          </div>

          {/* Remark */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium px-1">备注</label>
            <MobileFormInput
              placeholder="添加备注说明"
              value={formData.remark || ''}
              onChange={(value) => handleChange('remark', value)}
            />
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            className="w-full min-h-[52px] text-base gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <Check className="size-5" />
                创建
              </>
            )}
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
