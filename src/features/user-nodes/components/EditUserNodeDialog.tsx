/**
 * Edit user node dialog component
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Badge } from '@/components/common/Badge';
import { Separator } from '@/components/common/Separator';
import type { UserNode, UpdateUserNodeRequest, NodeProtocol } from '@/api/node';

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
  anytls: 'AnyTLS',
};

interface EditUserNodeDialogProps {
  open: boolean;
  node: UserNode | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateUserNodeRequest) => Promise<void>;
}

interface FormData {
  name: string;
  serverAddress: string;
  agentPort: string;
  subscriptionPort: string;
}

export const EditUserNodeDialog: React.FC<EditUserNodeDialogProps> = ({
  open,
  node,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    serverAddress: '',
    agentPort: '',
    subscriptionPort: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Initialize form when node changes
  useEffect(() => {
    if (node) {
      setFormData({
        name: node.name,
        serverAddress: node.serverAddress,
        agentPort: String(node.agentPort),
        subscriptionPort: node.subscriptionPort ? String(node.subscriptionPort) : '',
      });
      setErrors({});
    }
  }, [node]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('userNodes.edit.validation.nameRequired');
    }
    if (!formData.agentPort || isNaN(Number(formData.agentPort)) || Number(formData.agentPort) <= 0) {
      newErrors.agentPort = t('userNodes.edit.validation.validPort');
    }
    if (formData.subscriptionPort && (isNaN(Number(formData.subscriptionPort)) || Number(formData.subscriptionPort) <= 0)) {
      newErrors.subscriptionPort = t('userNodes.edit.validation.validPort');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!node || !validate()) return;

    setLoading(true);
    try {
      // Only submit changed fields
      const updates: UpdateUserNodeRequest = {};

      if (formData.name.trim() !== node.name) {
        updates.name = formData.name.trim();
      }
      const newServerAddress = formData.serverAddress.trim() || undefined;
      if (newServerAddress !== node.serverAddress) {
        updates.serverAddress = newServerAddress;
      }
      if (Number(formData.agentPort) !== node.agentPort) {
        updates.agentPort = Number(formData.agentPort);
      }
      const newSubscriptionPort = formData.subscriptionPort ? Number(formData.subscriptionPort) : undefined;
      if (newSubscriptionPort !== node.subscriptionPort) {
        updates.subscriptionPort = newSubscriptionPort;
      }

      // Only submit if there are changes
      if (Object.keys(updates).length > 0) {
        await onSubmit(node.id, updates);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('userNodes.edit.title')}</DialogTitle>
          <DialogDescription>
            {t('userNodes.edit.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Read-only info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('userNodes.edit.readOnlyInfo')}</h3>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('common.protocol')}</span>
                <Badge variant="outline" className="ml-2">
                  {PROTOCOL_NAMES[node.protocol] || node.protocol}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">{t('common.status.label')}</span>
                <Badge
                  variant={node.status === 'active' ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {t(`common.status.${node.status}`)}
                </Badge>
              </div>
              {node.encryptionMethod && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">{t('userNodes.edit.encryptionMethod')}</span>
                  <span className="font-mono ml-2">{node.encryptionMethod}</span>
                </div>
              )}
              {node.transportProtocol && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">{t('userNodes.edit.transportProtocol')}</span>
                  <span className="ml-2">{node.transportProtocol.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('common.sections.editableInfo')}</h3>
            <Separator />

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">
                  {t('userNodes.edit.nodeName')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={loading}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="serverAddress">{t('userNodes.edit.serverAddress')}</Label>
                <Input
                  id="serverAddress"
                  value={formData.serverAddress}
                  onChange={(e) => handleChange('serverAddress', e.target.value)}
                  placeholder={t('userNodes.edit.serverAddressPlaceholder')}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">{t('userNodes.edit.serverAddressHint')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="agentPort">
                    {t('userNodes.edit.agentPort')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="agentPort"
                    type="number"
                    min="1"
                    max="65535"
                    value={formData.agentPort}
                    onChange={(e) => handleChange('agentPort', e.target.value)}
                    disabled={loading}
                  />
                  {errors.agentPort && <p className="text-xs text-destructive">{errors.agentPort}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="subscriptionPort">{t('userNodes.edit.subscriptionPort')}</Label>
                  <Input
                    id="subscriptionPort"
                    type="number"
                    min="1"
                    max="65535"
                    value={formData.subscriptionPort}
                    onChange={(e) => handleChange('subscriptionPort', e.target.value)}
                    placeholder={t('userNodes.edit.subscriptionPortPlaceholder')}
                    disabled={loading}
                  />
                  {errors.subscriptionPort && <p className="text-xs text-destructive">{errors.subscriptionPort}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? t('userNodes.edit.saving') : t('common.actions.save')}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
