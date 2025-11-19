/**
 * 订阅确认对话框（占位组件）
 * 用于显示订阅信息，暂不对接支付接口
 */

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { BillingCycleBadge } from './BillingCycleBadge';
import { PlanPricingSelector } from './PlanPricingSelector';
import type { SubscriptionPlan, PlanPricing } from '../types/subscription-plans.types';

interface SubscriptionConfirmDialogProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  onClose: () => void;
}

const BILLING_CYCLE_LABELS: Record<string, string> = {
  monthly: '月',
  quarterly: '季',
  semi_annual: '半年',
  annual: '年',
  lifetime: '次（终身）',
};

export const SubscriptionConfirmDialog: React.FC<SubscriptionConfirmDialogProps> = ({
  open,
  plan,
  onClose,
}) => {
  // 状态：用户选择的定价
  const [selectedPricing, setSelectedPricing] = useState<PlanPricing | null>(null);

  if (!plan) return null;

  // 检查是否有多定价选项
  const hasPricings = plan.pricings && plan.pricings.length > 0;

  // 获取当前价格和货币（优先使用用户选择的定价）
  const currentPrice = selectedPricing?.price || plan.Price;
  const currentCurrency = selectedPricing?.currency || plan.Currency;
  const currentBillingCycle = selectedPricing?.billing_cycle || plan.BillingCycle;

  const currencySymbol = currentCurrency === 'CNY' ? '¥' : '$';
  const formattedPrice = (currentPrice / 100).toFixed(2);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        确认订阅
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* 提示信息 */}
        <Alert severity="info" sx={{ mb: 3 }}>
          支付功能即将上线！目前仅显示订阅信息预览。
        </Alert>

        {/* 计划信息 */}
        <Box mb={3}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            {plan.Name}
          </Typography>
          {!hasPricings && <BillingCycleBadge billingCycle={plan.BillingCycle} />}
        </Box>

        {/* 描述 */}
        {plan.Description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {plan.Description}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* 价格详情 */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            价格详情
          </Typography>

          {hasPricings ? (
            // 使用多定价选择器
            <Box mt={2}>
              <PlanPricingSelector
                pricings={plan.pricings!}
                defaultBillingCycle={plan.BillingCycle}
                onPricingChange={(pricing) => setSelectedPricing(pricing)}
              />
            </Box>
          ) : (
            // 向后兼容：显示单一价格
            <>
              <Box display="flex" justifyContent="space-between" alignItems="baseline" mt={1}>
                <Typography variant="body1">
                  订阅费用
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {currencySymbol}{formattedPrice}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                每{BILLING_CYCLE_LABELS[currentBillingCycle]}
              </Typography>
            </>
          )}
        </Box>

        {/* 试用期 */}
        {plan.TrialDays && plan.TrialDays > 0 && (
          <Alert severity="success" sx={{ mb: 3 }}>
            免费试用 {plan.TrialDays} 天，试用期结束后自动扣费
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* 功能列表 */}
        {plan.Features && plan.Features.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              包含功能
            </Typography>
            <List dense>
              {plan.Features.map((feature, index) => (
                <ListItem key={index} disableGutters>
                  <CheckCircleIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                  <ListItemText primary={feature} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* 使用限制 */}
        {(plan.MaxUsers || plan.MaxProjects) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                使用限制
              </Typography>
              <List dense>
                {plan.MaxUsers && (
                  <ListItem disableGutters>
                    <ListItemText
                      primary={`最多 ${plan.MaxUsers} 个用户`}
                      secondary="团队成员数量上限"
                    />
                  </ListItem>
                )}
                {plan.MaxProjects && (
                  <ListItem disableGutters>
                    <ListItemText
                      primary={`最多 ${plan.MaxProjects} 个项目`}
                      secondary="可创建的项目数量"
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </>
        )}

        {/* 说明 */}
        <Box mt={3}>
          <Typography variant="caption" color="text.secondary">
            订阅后可随时取消或更换套餐。如有疑问，请联系客服。
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} size="large">
          取消
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={() => {
            // 暂时只关闭对话框，未来这里会跳转到支付页面
            alert('支付功能即将上线！');
            onClose();
          }}
        >
          {plan.TrialDays ? '开始免费试用' : '立即订阅'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
