/**
 * 计划多定价编辑器组件
 * 用于在创建/编辑计划时管理多个定价选项
 */

import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Paper,
  Stack,
  Divider,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { BillingCycle, PlanPricing } from '../types/subscription-plans.types';

interface PlanPricingsEditorProps {
  pricings: PlanPricing[];
  onChange: (pricings: PlanPricing[]) => void;
  disabled?: boolean;
}

const BILLING_CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'semi_annual', label: '半年付' },
  { value: 'annual', label: '年付' },
  { value: 'lifetime', label: '终身' },
];

const CURRENCY_OPTIONS = [
  { value: 'CNY', label: 'CNY (人民币)' },
  { value: 'USD', label: 'USD (美元)' },
];

export const PlanPricingsEditor: React.FC<PlanPricingsEditorProps> = ({
  pricings,
  onChange,
  disabled = false,
}) => {
  const handleAddPricing = () => {
    const newPricing: PlanPricing = {
      billing_cycle: 'monthly',
      price: 0,
      currency: 'CNY',
      is_active: true,
    };
    onChange([...pricings, newPricing]);
  };

  const handleRemovePricing = (index: number) => {
    onChange(pricings.filter((_, i) => i !== index));
  };

  const handleUpdatePricing = (index: number, updates: Partial<PlanPricing>) => {
    const updated = pricings.map((pricing, i) =>
      i === index ? { ...pricing, ...updates } : pricing
    );
    onChange(updated);
  };

  // 检查是否有重复的计费周期
  const getDuplicateCycles = () => {
    const cycles = pricings.map(p => p.billing_cycle);
    return cycles.filter((cycle, index) => cycles.indexOf(cycle) !== index);
  };

  const duplicateCycles = getDuplicateCycles();
  const hasDuplicates = duplicateCycles.length > 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" fontWeight="bold">
          多定价选项（可选）
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddPricing}
          disabled={disabled}
        >
          添加定价
        </Button>
      </Box>

      {hasDuplicates && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          检测到重复的计费周期：{duplicateCycles.join(', ')}。每个计费周期只能有一个定价选项。
        </Alert>
      )}

      {pricings.length === 0 ? (
        <Alert severity="info">
          未配置多定价选项。点击"添加定价"按钮可为此计划添加不同计费周期的价格。
        </Alert>
      ) : (
        <Stack spacing={2}>
          {pricings.map((pricing, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2" color="primary">
                  定价选项 #{index + 1}
                </Typography>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemovePricing(index)}
                  disabled={disabled}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              <Stack spacing={2}>
                <Box display="flex" gap={2}>
                  <TextField
                    label="计费周期"
                    select
                    fullWidth
                    value={pricing.billing_cycle}
                    onChange={(e) =>
                      handleUpdatePricing(index, {
                        billing_cycle: e.target.value as BillingCycle,
                      })
                    }
                    disabled={disabled}
                    error={duplicateCycles.includes(pricing.billing_cycle)}
                    helperText={
                      duplicateCycles.includes(pricing.billing_cycle)
                        ? '此计费周期已存在'
                        : ''
                    }
                  >
                    {BILLING_CYCLE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="货币"
                    select
                    fullWidth
                    value={pricing.currency}
                    onChange={(e) =>
                      handleUpdatePricing(index, { currency: e.target.value })
                    }
                    disabled={disabled}
                  >
                    {CURRENCY_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <TextField
                  label="价格（元）"
                  type="number"
                  fullWidth
                  value={pricing.price / 100}
                  onChange={(e) => {
                    const yuan = Number(e.target.value);
                    handleUpdatePricing(index, {
                      price: Math.round(yuan * 100),
                    });
                  }}
                  inputProps={{ step: '0.01', min: '0' }}
                  disabled={disabled}
                  helperText={`${pricing.price / 100} 元 = ${pricing.price} 分`}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={pricing.is_active}
                      onChange={(e) =>
                        handleUpdatePricing(index, { is_active: e.target.checked })
                      }
                      disabled={disabled}
                    />
                  }
                  label="激活此定价选项"
                />
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="caption" color="text.secondary">
        提示：多定价功能允许您为同一个计划配置不同计费周期的价格，如月付、年付等。用户在订阅时可以选择适合自己的计费周期。
      </Typography>
    </Box>
  );
};
