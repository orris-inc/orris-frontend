/**
 * 订阅计划筛选组件
 */

import {
  Box,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
} from '@mui/material';
import type { BillingCycle, PlanStatus, SubscriptionPlanFilters } from '../types/subscription-plans.types';

interface PlanFiltersProps {
  filters: SubscriptionPlanFilters;
  onChange: (filters: Partial<SubscriptionPlanFilters>) => void;
}

const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'semi_annual', label: '半年付' },
  { value: 'annual', label: '年付' },
  { value: 'lifetime', label: '终身' },
];

const STATUSES: { value: PlanStatus; label: string }[] = [
  { value: 'active', label: '激活' },
  { value: 'inactive', label: '未激活' },
  { value: 'archived', label: '已归档' },
];

export const PlanFilters: React.FC<PlanFiltersProps> = ({
  filters,
  onChange,
}) => {
  return (
    <Box mb={3}>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            fullWidth
            select
            label="状态"
            value={filters.status || ''}
            onChange={(e) => onChange({ status: e.target.value as PlanStatus || undefined })}
            size="small"
          >
            <MenuItem value="">全部</MenuItem>
            {STATUSES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            fullWidth
            select
            label="计费周期"
            value={filters.billing_cycle || ''}
            onChange={(e) => onChange({ billing_cycle: e.target.value as BillingCycle || undefined })}
            size="small"
          >
            <MenuItem value="">全部</MenuItem>
            {BILLING_CYCLES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            fullWidth
            label="搜索名称"
            value={filters.search || ''}
            onChange={(e) => onChange({ search: e.target.value })}
            size="small"
            placeholder="输入计划名称..."
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.is_public ?? false}
                onChange={(e) => onChange({ is_public: e.target.checked ? true : undefined })}
              />
            }
            label="仅公开计划"
          />
        </Grid>
      </Grid>
    </Box>
  );
};
