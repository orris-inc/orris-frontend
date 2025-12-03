/**
 * 创建节点组对话框组件
 */

import { useState } from 'react';
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
import type { CreateNodeGroupRequest } from '@/api/node';

interface CreateNodeGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateNodeGroupRequest) => Promise<void>;
}

export const CreateNodeGroupDialog = ({
  open,
  onClose,
  onSubmit,
}: CreateNodeGroupDialogProps) => {
  const [formData, setFormData] = useState<CreateNodeGroupRequest>({
    name: '',
    description: '',
    isPublic: false,
    sortOrder: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: keyof CreateNodeGroupRequest) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = field === 'isPublic' ? (event.target as HTMLInputElement).checked :
                  field === 'sortOrder' ? Number(event.target.value) :
                  event.target.value;

    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    // 验证
    if (!formData.name.trim()) {
      setError('请输入节点组名称');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      // 重置表单
      setFormData({
        name: '',
        description: '',
        isPublic: false,
        sortOrder: 0,
      });
      onClose();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || '创建失败，请重试');
      } else {
        setError('创建失败，请重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        name: '',
        description: '',
        isPublic: false,
        sortOrder: 0,
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新增节点组</DialogTitle>
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
              value={formData.name}
              onChange={handleChange('name')}
              placeholder="例如：高级节点组"
              error={!!error && !formData.name.trim()}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleChange('description')}
              rows={3}
              placeholder="节点组的描述信息"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_public"
              checked={formData.isPublic}
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
              value={formData.sortOrder}
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
            disabled={submitting || !formData.name.trim()}
          >
            {submitting ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
