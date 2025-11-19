/**
 * 创建节点组对话框组件
 */

import { useState } from 'react';
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
import type { CreateNodeGroupRequest } from '../types/node-groups.types';

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
    is_public: false,
    sort_order: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: keyof CreateNodeGroupRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'is_public' ? event.target.checked :
                  field === 'sort_order' ? Number(event.target.value) :
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
        is_public: false,
        sort_order: 0,
      });
      onClose();
    } catch (err) {
      setError('创建失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        name: '',
        description: '',
        is_public: false,
        sort_order: 0,
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>新增节点组</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} pt={1}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="节点组名称"
            value={formData.name}
            onChange={handleChange('name')}
            required
            fullWidth
            placeholder="例如：高级节点组"
          />

          <TextField
            label="描述"
            value={formData.description}
            onChange={handleChange('description')}
            multiline
            rows={3}
            fullWidth
            placeholder="节点组的描述信息"
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.is_public}
                onChange={handleChange('is_public')}
              />
            }
            label="公开"
          />

          <TextField
            label="排序顺序"
            type="number"
            value={formData.sort_order}
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
          disabled={submitting || !formData.name.trim()}
        >
          {submitting ? '创建中...' : '创建'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
