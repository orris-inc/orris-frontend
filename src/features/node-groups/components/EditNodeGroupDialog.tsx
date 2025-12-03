/**
 * 编辑节点组对话框组件
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Label } from '@/components/common/Label';
import { Alert, AlertDescription } from '@/components/common/Alert';
import type { NodeGroup, UpdateNodeGroupRequest } from '@/api/node';

interface EditNodeGroupDialogProps {
  open: boolean;
  group: NodeGroup | null;
  onClose: () => void;
  onSubmit: (id: number | string, data: UpdateNodeGroupRequest) => Promise<void>;
}

export const EditNodeGroupDialog = ({
  open,
  group,
  onClose,
  onSubmit,
}: EditNodeGroupDialogProps) => {
  const [formData, setFormData] = useState<UpdateNodeGroupRequest>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 当group变化时，更新表单数据
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
        isPublic: group.isPublic,
        sortOrder: group.sortOrder,
      });
    }
  }, [group]);

  const handleChange = (field: keyof UpdateNodeGroupRequest) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = field === 'isPublic' ? (event.target as HTMLInputElement).checked :
                  field === 'sortOrder' ? Number(event.target.value) :
                  event.target.value;

    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!group) return;

    // 验证
    if (formData.name && !formData.name.trim()) {
      setError('节点组名称不能为空');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(group.id, formData);
      onClose();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || '更新失败，请重试');
      } else {
        setError('更新失败，请重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({});
      setError('');
      onClose();
    }
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑节点组</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              节点组名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={handleChange('name')}
              placeholder="例如：高级节点组"
              error={!!error && formData.name !== undefined && !formData.name.trim()}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={handleChange('description')}
              rows={3}
              placeholder="节点组的描述信息"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_public"
              checked={formData.isPublic ?? false}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isPublic: checked }))
              }
            >
              <SwitchThumb />
            </Switch>
            <Label htmlFor="is_public">公开</Label>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="sort_order">排序顺序</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sortOrder ?? 0}
              onChange={handleChange('sortOrder')}
            />
            <p className="text-sm text-muted-foreground">数字越小越靠前</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || (formData.name !== undefined && !formData.name.trim())}
          >
            {submitting ? '更新中...' : '更新'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
