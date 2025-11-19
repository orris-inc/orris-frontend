/**
 * 编辑节点组对话框组件
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Alert,
} from '@mui/material';
import type { NodeGroupListItem, UpdateNodeGroupRequest } from '../types/node-groups.types';

interface EditNodeGroupDialogProps {
  open: boolean;
  group: NodeGroupListItem | null;
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
        is_public: group.is_public,
        sort_order: group.sort_order,
      });
    }
  }, [group]);

  const handleChange = (field: keyof UpdateNodeGroupRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'is_public' ? event.target.checked :
                  field === 'sort_order' ? Number(event.target.value) :
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
    } catch (err) {
      setError('更新失败，请重试');
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>编辑节点组</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} pt={1}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="节点组名称"
            value={formData.name || ''}
            onChange={handleChange('name')}
            required
            fullWidth
            placeholder="例如：高级节点组"
          />

          <TextField
            label="描述"
            value={formData.description || ''}
            onChange={handleChange('description')}
            multiline
            rows={3}
            fullWidth
            placeholder="节点组的描述信息"
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.is_public ?? false}
                onChange={handleChange('is_public')}
              />
            }
            label="公开"
          />

          <TextField
            label="排序顺序"
            type="number"
            value={formData.sort_order ?? 0}
            onChange={handleChange('sort_order')}
            fullWidth
            helperText="数字越小越靠前"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || (formData.name !== undefined && !formData.name.trim())}
        >
          {submitting ? '更新中...' : '更新'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
