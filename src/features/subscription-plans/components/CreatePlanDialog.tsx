/**
 * 创建订阅计划对话框
 */

import { useState } from 'react';
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
import type { CreatePlanRequest, BillingCycle } from '../types/subscription-plans.types';

interface CreatePlanDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePlanRequest) => Promise<void>;
}

const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'semi_annual', label: '半年付' },
  { value: 'annual', label: '年付' },
  { value: 'lifetime', label: '终身' },
];

export const CreatePlanDialog: React.FC<CreatePlanDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreatePlanRequest>({
    name: '',
    slug: '',
    price: 0,
    currency: 'CNY',
    billing_cycle: 'monthly',
    description: '',
    features: [],
    is_public: true,
    trial_days: 0,
    max_users: undefined,
    max_projects: undefined,
    api_rate_limit: undefined,
    sort_order: 0,
  });

  const [newFeature, setNewFeature] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof CreatePlanRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof CreatePlanRequest) => (
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
    setLoading(true);
    try {
      // 转换价格为分
      const submitData: CreatePlanRequest = {
        ...formData,
        price: Math.round(formData.price * 100), // 元转分
      };
      await onSubmit(submitData);
      onClose();
      // 重置表单
      setFormData({
        name: '',
        slug: '',
        price: 0,
        currency: 'CNY',
        billing_cycle: 'monthly',
        description: '',
        features: [],
        is_public: true,
        trial_days: 0,
        sort_order: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        创建订阅计划
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* 基本信息 */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>
              基本信息
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="计划名称"
              required
              value={formData.name}
              onChange={handleChange('name')}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Slug (URL标识)"
              required
              value={formData.slug}
              onChange={handleChange('slug')}
              helperText="仅小写字母、数字和连字符"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="价格（元）"
              type="number"
              required
              value={formData.price}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))}
              inputProps={{ step: '0.01', min: '0' }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              select
              label="货币"
              required
              value={formData.currency}
              onChange={handleChange('currency')}
            >
              <MenuItem value="CNY">CNY (人民币)</MenuItem>
              <MenuItem value="USD">USD (美元)</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              select
              label="计费周期"
              required
              value={formData.billing_cycle}
              onChange={handleChange('billing_cycle')}
            >
              {BILLING_CYCLES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="描述"
              multiline
              rows={3}
              value={formData.description}
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
              限制配置（可选）
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

          {/* 其他设置 */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>
              其他设置
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="试用天数"
              type="number"
              value={formData.trial_days || 0}
              onChange={handleNumberChange('trial_days')}
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
                  checked={formData.is_public}
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
          disabled={loading || !formData.name || !formData.slug}
        >
          {loading ? '创建中...' : '创建'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
