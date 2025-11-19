/**
 * 编辑订阅计划对话框
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Chip,
  IconButton,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import type { SubscriptionPlan, UpdatePlanRequest } from '../types/subscription-plans.types';

interface EditPlanDialogProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSubmit: (id: number, data: UpdatePlanRequest) => Promise<void>;
}

export const EditPlanDialog: React.FC<EditPlanDialogProps> = ({
  open,
  plan,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UpdatePlanRequest>({});
  const [newFeature, setNewFeature] = useState('');
  const [loading, setLoading] = useState(false);

  // 当plan变化时，更新表单数据
  useEffect(() => {
    if (plan) {
      setFormData({
        price: plan.Price,
        currency: plan.Currency,
        description: plan.Description,
        features: plan.Features || [],
        is_public: plan.IsPublic,
        max_users: plan.MaxUsers,
        max_projects: plan.MaxProjects,
        api_rate_limit: plan.APIRateLimit,
        sort_order: plan.SortOrder,
      });
    }
  }, [plan]);

  const handleChange = (field: keyof UpdatePlanRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof UpdatePlanRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value === '' ? undefined : Number(e.target.value);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      // 价格已经在 onChange 中转换为分（第172行），这里直接使用即可
      const submitData: UpdatePlanRequest = {
        ...formData,
        // formData.price 已经是分单位，无需再转换
        price: formData.price,
      };
      await onSubmit(plan.ID, submitData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        编辑订阅计划: {plan.Name}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* 基本信息（只读） */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>
              基本信息（只读）
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="计划名称"
              value={plan.Name}
              disabled
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Slug"
              value={plan.Slug}
              disabled
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="计费周期"
              value={plan.BillingCycle}
              disabled
            />
          </Grid>

          {/* 可编辑字段 */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>
              可编辑信息
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="价格（元）"
              type="number"
              value={formData.price !== undefined ? formData.price / 100 : ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value) * 100 }))}
              inputProps={{ step: '0.01', min: '0' }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              select
              label="货币"
              value={formData.currency || plan.Currency}
              onChange={handleChange('currency')}
            >
              <MenuItem value="CNY">CNY (人民币)</MenuItem>
              <MenuItem value="USD">USD (美元)</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="描述"
              multiline
              rows={3}
              value={formData.description || ''}
              onChange={handleChange('description')}
            />
          </Grid>

          {/* 功能列表 */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>
              功能列表
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box display="flex" gap={1} mb={1}>
              <TextField
                fullWidth
                size="small"
                label="添加功能"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
              />
              <Button
                variant="contained"
                onClick={handleAddFeature}
                startIcon={<AddIcon />}
              >
                添加
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {formData.features?.map((feature, index) => (
                <Chip
                  key={index}
                  label={feature}
                  onDelete={() => handleRemoveFeature(index)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>

          {/* 限制配置 */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>
              限制配置
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="最大用户数"
              type="number"
              value={formData.max_users || ''}
              onChange={handleNumberChange('max_users')}
              inputProps={{ min: '0' }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="最大项目数"
              type="number"
              value={formData.max_projects || ''}
              onChange={handleNumberChange('max_projects')}
              inputProps={{ min: '0' }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="API速率限制（次/小时）"
              type="number"
              value={formData.api_rate_limit || ''}
              onChange={handleNumberChange('api_rate_limit')}
              inputProps={{ min: '0' }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="排序顺序"
              type="number"
              value={formData.sort_order || 0}
              onChange={handleNumberChange('sort_order')}
              helperText="数字越小越靠前"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_public ?? plan.IsPublic}
                  onChange={handleChange('is_public')}
                />
              }
              label="公开显示此计划"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
