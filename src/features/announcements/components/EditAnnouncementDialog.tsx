/**
 * Edit Announcement Dialog
 * Desktop dialog for editing existing announcements
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
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { Label } from '@/components/common/Label';
import { Separator } from '@/components/common/Separator';
import type { Announcement, UpdateAnnouncementRequest } from '@/api/notification/types';

// ============================================================================
// Types
// ============================================================================

interface EditAnnouncementDialogProps {
  open: boolean;
  announcement: Announcement | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateAnnouncementRequest) => Promise<void>;
}

interface FormData {
  title: string;
  content: string;
  priority: number;
  expiresAt: string;
}

// Helper: format date for datetime-local input
const formatDateForInput = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    // Format: YYYY-MM-DDTHH:mm
    return date.toISOString().slice(0, 16);
  } catch {
    return '';
  }
};

// ============================================================================
// Component
// ============================================================================

export const EditAnnouncementDialog: React.FC<EditAnnouncementDialogProps> = ({
  open,
  announcement,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    priority: 0,
    expiresAt: '',
  });
  const [loading, setLoading] = useState(false);

  // Initialize form when dialog opens with announcement data
  useEffect(() => {
    if (open && announcement) {
      setFormData({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        expiresAt: formatDateForInput(announcement.expiresAt),
      });
    }
  }, [open, announcement]);

  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!announcement || !formData.title.trim() || !formData.content.trim()) {
      return;
    }

    setLoading(true);
    try {
      const submitData: UpdateAnnouncementRequest = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        priority: formData.priority,
        expiresAt: formData.expiresAt || undefined,
      };
      await onSubmit(announcement.id, submitData);
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
          <DialogTitle>{t('announcements.edit.title')}</DialogTitle>
          <DialogDescription>
            {t('announcements.edit.description', { title: announcement?.title })}
          </DialogDescription>
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

              <div className="flex flex-col gap-2">
                <Label htmlFor="content">
                  {t('announcements.fields.content')} <span className="text-destructive">*</span>
                </Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(html) => handleChange('content', html)}
                  placeholder={t('announcements.form.contentPlaceholder')}
                  disabled={loading}
                  minHeight="150px"
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

        <DialogFooter className="flex-shrink-0">
          <Button onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? t('common.loading.saving') : t('common.actions.save')}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

EditAnnouncementDialog.displayName = 'EditAnnouncementDialog';
