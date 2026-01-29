/**
 * Create Announcement Dialog
 * Desktop dialog for creating new announcements
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
import { Textarea } from '@/components/common/Textarea';
import { Label } from '@/components/common/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Separator } from '@/components/common/Separator';
import type { CreateAnnouncementRequest, AnnouncementType } from '@/api/notification/types';

// ============================================================================
// Types
// ============================================================================

interface CreateAnnouncementDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAnnouncementRequest) => Promise<void>;
}

interface FormData {
  title: string;
  content: string;
  type: AnnouncementType;
  priority: number;
  scheduledAt: string;
  expiresAt: string;
}

// Type options
const TYPE_OPTIONS: { value: AnnouncementType; label: string }[] = [
  { value: 'system', label: 'announcements.type.system' },
  { value: 'maintenance', label: 'announcements.type.maintenance' },
  { value: 'feature', label: 'announcements.type.feature' },
  { value: 'promotion', label: 'announcements.type.promotion' },
];

// Default form data
const getDefaultFormData = (): FormData => ({
  title: '',
  content: '',
  type: 'system',
  priority: 0,
  scheduledAt: '',
  expiresAt: '',
});

// ============================================================================
// Component
// ============================================================================

export const CreateAnnouncementDialog: React.FC<CreateAnnouncementDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>(getDefaultFormData());
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(getDefaultFormData());
    }
  }, [open]);

  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      return;
    }

    setLoading(true);
    try {
      const submitData: CreateAnnouncementRequest = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: formData.type,
        priority: formData.priority,
        scheduledAt: formData.scheduledAt || undefined,
        expiresAt: formData.expiresAt || undefined,
      };
      await onSubmit(submitData);
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

  const isValid = formData.title.trim() && formData.content.trim();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="@container sm:max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('announcements.create.title')}</DialogTitle>
          <DialogDescription>{t('announcements.create.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('common.sections.basicInfo')}</h3>
              <Separator />

              <div className="flex flex-col gap-2">
                <Label htmlFor="title">
                  {t('announcements.fields.title')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder={t('announcements.form.titlePlaceholder')}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="type">{t('announcements.type.label')}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange('type', value as AnnouncementType)}
                    disabled={loading}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(option.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="priority">{t('announcements.fields.priority')}</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', Number(e.target.value))}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('announcements.form.priorityHint')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="content">
                  {t('announcements.fields.content')} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  rows={6}
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder={t('announcements.form.contentPlaceholder')}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  {t('announcements.form.contentHint')}
                </p>
              </div>
            </div>

            {/* Schedule Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('announcements.form.schedule')}</h3>
              <Separator />

              <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="scheduledAt">{t('announcements.fields.scheduledAt')}</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => handleChange('scheduledAt', e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('announcements.form.scheduledAtHint')}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="expiresAt">{t('announcements.fields.expiresAt')}</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => handleChange('expiresAt', e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('announcements.form.expiresAtHint')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? t('common.loading.creating') : t('common.actions.create')}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

CreateAnnouncementDialog.displayName = 'CreateAnnouncementDialog';
