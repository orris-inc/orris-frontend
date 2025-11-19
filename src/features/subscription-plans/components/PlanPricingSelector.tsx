/**
 * 计划定价选择器组件
 * 用于显示和选择一个计划的多种定价选项
 */

import { useState } from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import type { PlanPricing, BillingCycle } from '../types/subscription-plans.types';

interface PlanPricingSelectorProps {
  pricings: PlanPricing[];
  defaultBillingCycle?: BillingCycle;
  onPricingChange?: (pricing: PlanPricing) => void;
}

// 计费周期显示名称映射
const billingCycleLabels: Record<BillingCycle, string> = {
  monthly: '月付',
  quarterly: '季付',
  semi_annual: '半年付',
  annual: '年付',
  lifetime: '终身',
};

export const PlanPricingSelector: React.FC<PlanPricingSelectorProps> = ({
  pricings,
  defaultBillingCycle,
  onPricingChange,
}) => {
  // 过滤激活的定价选项
  const activePricings = pricings.filter((p) => p.is_active);

  // 如果没有激活的定价，返回空
  if (activePricings.length === 0) {
    return null;
  }

  // 默认选择第一个激活的定价，或指定的计费周期
  const defaultPricing =
    activePricings.find((p) => p.billing_cycle === defaultBillingCycle) ||
    activePricings[0];

  const [selectedPricing, setSelectedPricing] = useState<PlanPricing>(defaultPricing);

  const handlePricingChange = (
    _event: React.MouseEvent<HTMLElement>,
    newBillingCycle: BillingCycle | null
  ) => {
    if (!newBillingCycle) return;

    const newPricing = activePricings.find((p) => p.billing_cycle === newBillingCycle);
    if (newPricing) {
      setSelectedPricing(newPricing);
      onPricingChange?.(newPricing);
    }
  };

  // 格式化价格
  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === 'CNY' ? '¥' : '$';
    const amount = (price / 100).toFixed(2);
    return `${symbol}${amount}`;
  };

  // 如果只有一个定价选项，直接显示价格
  if (activePricings.length === 1) {
    const pricing = activePricings[0];
    return (
      <Box>
        <Typography variant="h3" component="div" fontWeight="bold">
          {formatPrice(pricing.price, pricing.currency)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {billingCycleLabels[pricing.billing_cycle]}
        </Typography>
      </Box>
    );
  }

  // 多个定价选项，显示选择器
  return (
    <Box>
      {/* 计费周期选择器 */}
      <ToggleButtonGroup
        value={selectedPricing.billing_cycle}
        exclusive
        onChange={handlePricingChange}
        size="small"
        fullWidth
        sx={{ mb: 2 }}
      >
        {activePricings.map((pricing) => (
          <ToggleButton
            key={pricing.billing_cycle}
            value={pricing.billing_cycle}
            sx={{
              textTransform: 'none',
              fontSize: '0.875rem',
            }}
          >
            {billingCycleLabels[pricing.billing_cycle]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* 选中的价格 */}
      <Typography variant="h3" component="div" fontWeight="bold">
        {formatPrice(selectedPricing.price, selectedPricing.currency)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {billingCycleLabels[selectedPricing.billing_cycle]}
      </Typography>
    </Box>
  );
};
