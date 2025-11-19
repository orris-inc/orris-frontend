/**
 * 分配订阅对话框组件（管理端）
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import type { CreateSubscriptionRequest, BillingCycle } from '../types/subscriptions.types';
import type { UserListItem } from '@/features/users/types/users.types';

interface AssignSubscriptionDialogProps {
  open: boolean;
  user: UserListItem | null;
  onClose: () => void;
  onSubmit: (data: CreateSubscriptionRequest) => Promise<void>;
}

// 计费周期选项
const BILLING_CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'weekly', label: '周付' },
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'semi_annual', label: '半年付' },
  { value: 'yearly', label: '年付' },
  { value: 'lifetime', label: '终身' },
];

export const AssignSubscriptionDialog: React.FC<AssignSubscriptionDialogProps> = ({
  open,
  user,
  onClose,
  onSubmit,
}) => {
  const { plans, loading: plansLoading, fetchPlans } = useSubscriptionPlans();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateSubscriptionRequest>({
    plan_id: 0,
    billing_cycle: 'monthly',
    auto_renew: true,
  });

  // 加载订阅计划列表
  useEffect(() => {
    if (open) {
      fetchPlans(1, 100); // 加载所有计划
    }
  }, [open, fetchPlans]);

  // 重置表单
  useEffect(() => {
    if (open && user) {
      setFormData({
        plan_id: 0,
        billing_cycle: 'monthly',
        auto_renew: true,
        user_id: user.id,
      });
    }
  }, [open, user]);

  const handleSubmit = async () => {
    if (!formData.plan_id) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlan = plans.find(p => p.ID === formData.plan_id);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        为用户分配订阅
        {user && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            用户: {user.name} ({user.email})
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {plansLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 订阅计划选择 */}
            <FormControl fullWidth required>
              <InputLabel>订阅计划</InputLabel>
              <Select
                value={formData.plan_id || ''}
                onChange={(e) => setFormData({ ...formData, plan_id: Number(e.target.value) })}
                label="订阅计划"
              >
                <MenuItem value="">
                  <em>请选择计划</em>
                </MenuItem>
                {plans
                  .filter(plan => plan.Status === 'active')
                  .map((plan) => (
                    <MenuItem key={plan.ID} value={plan.ID}>
                      {plan.Name} - {(plan.Price / 100).toFixed(2)} {plan.Currency}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* 计费周期选择 */}
            <FormControl fullWidth required>
              <InputLabel>计费周期</InputLabel>
              <Select
                value={formData.billing_cycle}
                onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as BillingCycle })}
                label="计费周期"
              >
                {BILLING_CYCLE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 自动续费 */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.auto_renew}
                  onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                />
              }
              label="自动续费"
            />

            {/* 计划详情 */}
            {selectedPlan && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  计划详情
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  名称: {selectedPlan.Name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  价格: {(selectedPlan.Price / 100).toFixed(2)} {selectedPlan.Currency}
                </Typography>
                {selectedPlan.Description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {selectedPlan.Description}
                  </Typography>
                )}
                {selectedPlan.Features && selectedPlan.Features.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      功能:
                    </Typography>
                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                      {selectedPlan.Features.map((feature, index) => (
                        <li key={index}>
                          <Typography variant="body2" color="text.secondary">
                            {feature}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                  </Box>
                )}
              </Box>
            )}

            <Alert severity="info">
              管理员分配的订阅将立即生效，用户将获得对应计划的权限。
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.plan_id || submitting}
        >
          {submitting ? '分配中...' : '确认分配'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
