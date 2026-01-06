/**
 * 编辑转发节点对话框组件
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/common/Dialog";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Label } from "@/components/common/Label";
import { Separator } from "@/components/common/Separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/Select";
import { Switch, SwitchThumb } from "@/components/common/Switch";
import { cn } from "@/lib/utils";
import type {
  ForwardAgent,
  UpdateForwardAgentRequest,
  BlockedProtocol,
} from "@/api/forward";
import { useResourceGroups } from "@/features/resource-groups/hooks/useResourceGroups";

// Protocol groups for better organization
const PROTOCOL_GROUPS: {
  label: string;
  protocols: { value: BlockedProtocol; label: string }[];
}[] = [
  {
    label: "代理协议",
    protocols: [
      { value: "http_connect", label: "HTTP CONNECT" },
      { value: "socks4", label: "SOCKS4" },
      { value: "socks5", label: "SOCKS5" },
    ],
  },
  {
    label: "应用协议",
    protocols: [
      { value: "http", label: "HTTP" },
      { value: "tls", label: "TLS" },
      { value: "ssh", label: "SSH" },
      { value: "ftp", label: "FTP" },
    ],
  },
];

interface EditForwardAgentDialogProps {
  open: boolean;
  agent: ForwardAgent | null;
  onClose: () => void;
  onSubmit: (id: number | string, data: UpdateForwardAgentRequest) => void;
}

export const EditForwardAgentDialog: React.FC<EditForwardAgentDialogProps> = ({
  open,
  agent,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UpdateForwardAgentRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get resource group list
  const { resourceGroups, isLoading: isLoadingGroups } = useResourceGroups({
    pageSize: 100,
    filters: { status: "active" },
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
    }
  }, [agent]);

  const handleChange = (
    field: keyof UpdateForwardAgentRequest,
    value: string | number | boolean | undefined,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSortOrderChange = (value: string) => {
    if (value === "") {
      handleChange("sortOrder", undefined);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        handleChange("sortOrder", num);
      }
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

    if (formData.name !== undefined && !formData.name.trim()) {
      newErrors.name = "节点名称不能为空";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (agent && validate()) {
      // Only submit changed fields
      const updates: UpdateForwardAgentRequest = {};

      if (formData.name !== agent.name) updates.name = formData.name;
      if (formData.publicAddress !== agent.publicAddress)
        updates.publicAddress = formData.publicAddress;
      if (formData.tunnelAddress !== agent.tunnelAddress)
        updates.tunnelAddress = formData.tunnelAddress;
      if (formData.remark !== agent.remark) updates.remark = formData.remark;
      if (formData.allowedPortRange !== agent.allowedPortRange)
        updates.allowedPortRange = formData.allowedPortRange;
      if (formData.sortOrder !== agent.sortOrder)
        updates.sortOrder = formData.sortOrder;

      // Compare blocked protocols arrays
      const currentProtocols = agent.blockedProtocols || [];
      const newProtocols = formData.blockedProtocols || [];
      const protocolsChanged =
        currentProtocols.length !== newProtocols.length ||
        currentProtocols.some((p) => !newProtocols.includes(p)) ||
        newProtocols.some((p) => !currentProtocols.includes(p));
      if (protocolsChanged) {
        updates.blockedProtocols = newProtocols;
      }

      // Resource group association
      if (formData.groupSid !== undefined) {
        updates.groupSid = formData.groupSid;
      }

      // Mute notification setting
      if (formData.muteNotification !== agent.muteNotification) {
        updates.muteNotification = formData.muteNotification;
      }

      // If any changes, submit update
      if (Object.keys(updates).length > 0) {
        onSubmit(agent.id, updates);
      }
    }
  };

  // Check for changes
  const hasChanges =
    agent &&
    Object.keys(formData).some(
      (key) =>
        formData[key as keyof UpdateForwardAgentRequest] !==
        agent[key as keyof ForwardAgent],
    );

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>编辑转发节点</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-6">
            {/* 节点基本信息（只读） */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                基本信息
              </h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="agent_id">节点ID</Label>
                  <Input id="agent_id" value={agent.id} disabled />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="createdAt">创建时间</Label>
                  <Input
                    id="createdAt"
                    value={new Date(agent.createdAt).toLocaleString("zh-CN")}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* 可编辑字段 */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                可编辑信息
              </h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 gap-4">
                {/* 节点名称 */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">节点名称</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    error={!!errors.name}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>

                {/* 公网地址 */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="publicAddress">公网地址</Label>
                  <Input
                    id="publicAddress"
                    value={formData.publicAddress || ""}
                    onChange={(e) =>
                      handleChange("publicAddress", e.target.value)
                    }
                    placeholder="例如：192.168.1.100 或 example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    可选，用于标识节点的公网访问地址
                  </p>
                </div>

                {/* 隧道地址 */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tunnelAddress">隧道地址</Label>
                  <Input
                    id="tunnelAddress"
                    value={formData.tunnelAddress || ""}
                    onChange={(e) =>
                      handleChange("tunnelAddress", e.target.value)
                    }
                    placeholder="例如：10.0.0.1 或 internal.example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    若 Agent 可能作为 relay/exit 角色，需配置此地址（IP
                    或主机名，不含端口）
                  </p>
                </div>

                {/* 端口限制 */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="allowedPortRange">端口限制</Label>
                  <Input
                    id="allowedPortRange"
                    value={formData.allowedPortRange || ""}
                    onChange={(e) =>
                      handleChange("allowedPortRange", e.target.value)
                    }
                    placeholder="例如：80,443,8000-9000"
                  />
                  <p className="text-xs text-muted-foreground">
                    可选，留空表示允许所有端口
                  </p>
                </div>

                {/* 排序顺序 */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sortOrder">排序顺序</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min={0}
                    value={formData.sortOrder ?? ""}
                    onChange={(e) => handleSortOrderChange(e.target.value)}
                    placeholder="例如：100"
                  />
                  <p className="text-xs text-muted-foreground">
                    数值越小排序越靠前
                  </p>
                </div>

                {/* 阻止协议 */}
                <div className="flex flex-col gap-3">
                  <Label>阻止协议</Label>
                  <div className="space-y-3">
                    {PROTOCOL_GROUPS.map((group) => (
                      <div key={group.label}>
                        <p className="text-xs text-muted-foreground mb-2">
                          {group.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {group.protocols.map((protocol) => {
                            const isSelected =
                              formData.blockedProtocols?.includes(
                                protocol.value
                              ) || false;
                            return (
                              <button
                                key={protocol.value}
                                type="button"
                                onClick={() =>
                                  handleProtocolToggle(
                                    protocol.value,
                                    !isSelected
                                  )
                                }
                                className={cn(
                                  "px-3 py-1.5 text-sm rounded-md border transition-colors cursor-pointer",
                                  isSelected
                                    ? "bg-destructive/10 border-destructive/50 text-destructive"
                                    : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
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
                  <p className="text-xs text-muted-foreground">
                    点击选择需要阻止的协议类型
                  </p>
                </div>

                {/* 备注 */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="remark">备注</Label>
                  <Textarea
                    id="remark"
                    rows={3}
                    value={formData.remark || ""}
                    onChange={(e) => handleChange("remark", e.target.value)}
                  />
                </div>

                {/* 资源组 */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="groupSid">资源组</Label>
                  <Select
                    value={formData.groupSid ?? "__none__"}
                    onValueChange={(value) =>
                      handleChange(
                        "groupSid",
                        value === "__none__" ? "" : value,
                      )
                    }
                    disabled={isLoadingGroups}
                  >
                    <SelectTrigger id="groupSid">
                      <SelectValue
                        placeholder={
                          isLoadingGroups ? "加载中..." : "选择资源组"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">不关联资源组</SelectItem>
                      {resourceGroups.map((group) => (
                        <SelectItem key={group.sid} value={group.sid}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    可选，将转发节点关联到资源组
                  </p>
                </div>

                {/* 静音通知 */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="muteNotification">静音通知</Label>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="muteNotification"
                      checked={formData.muteNotification ?? false}
                      onCheckedChange={(checked) =>
                        handleChange("muteNotification", checked)
                      }
                    >
                      <SwitchThumb />
                    </Switch>
                    <span className="text-sm text-muted-foreground">
                      {formData.muteNotification ? "已静音" : "未静音"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    开启后将不会发送此节点的上线/下线通知
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!hasChanges}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
