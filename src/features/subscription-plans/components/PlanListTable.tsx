/**
 * 订阅计划列表表格组件（管理端）
 */

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography,
  TablePagination,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { BillingCycleBadge } from './BillingCycleBadge';
import type { SubscriptionPlan, PlanStatus } from '../types/subscription-plans.types';

// 获取计划的价格范围（支持多定价）
const getPriceRange = (plan: SubscriptionPlan) => {
  const currencySymbol = plan.Currency === 'CNY' ? '¥' : '$';

  // 如果有多定价，计算价格范围
  if (plan.pricings && plan.pricings.length > 1) {
    const activePricings = plan.pricings.filter(p => p.is_active);
    if (activePricings.length > 1) {
      const prices = activePricings.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      if (minPrice !== maxPrice) {
        return {
          display: `${currencySymbol}${(minPrice / 100).toFixed(2)} - ${currencySymbol}${(maxPrice / 100).toFixed(2)}`,
          details: activePricings.map(p => ({
            cycle: p.billing_cycle,
            price: `${p.currency === 'CNY' ? '¥' : '$'}${(p.price / 100).toFixed(2)}`,
          })),
        };
      }
    }
  }

  // 单一价格
  return {
    display: `${currencySymbol}${(plan.Price / 100).toFixed(2)}`,
    details: null,
  };
};

interface PlanListTableProps {
  plans: SubscriptionPlan[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (plan: SubscriptionPlan) => void;
  onToggleStatus: (plan: SubscriptionPlan) => void;
}

const STATUS_LABELS: Record<PlanStatus, string> = {
  active: '激活',
  inactive: '未激活',
  archived: '已归档',
};

const STATUS_COLORS: Record<PlanStatus, 'success' | 'default' | 'warning'> = {
  active: 'success',
  inactive: 'default',
  archived: 'warning',
};

export const PlanListTable: React.FC<PlanListTableProps> = ({
  plans,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onToggleStatus,
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">
          暂无订阅计划
        </Typography>
      </Box>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>计划名称</TableCell>
              <TableCell>价格</TableCell>
              <TableCell>计费周期</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>公开</TableCell>
              <TableCell>试用天数</TableCell>
              <TableCell>排序</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.ID} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {plan.Name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {plan.Slug}
                  </Typography>
                </TableCell>
                <TableCell>
                  {(() => {
                    const priceRange = getPriceRange(plan);
                    if (priceRange.details) {
                      // 多定价：显示价格范围 + Tooltip
                      return (
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="caption" display="block" gutterBottom fontWeight="bold">
                                所有定价选项：
                              </Typography>
                              {priceRange.details.map((detail, idx) => (
                                <Typography key={idx} variant="caption" display="block">
                                  {detail.cycle}: {detail.price}
                                </Typography>
                              ))}
                            </Box>
                          }
                          arrow
                        >
                          <Typography variant="body2" sx={{ cursor: 'help', textDecoration: 'underline dotted' }}>
                            {priceRange.display}
                          </Typography>
                        </Tooltip>
                      );
                    }
                    // 单一价格
                    return (
                      <Typography variant="body2">
                        {priceRange.display}
                      </Typography>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <BillingCycleBadge billingCycle={plan.BillingCycle} />
                </TableCell>
                <TableCell>
                  <Chip
                    label={STATUS_LABELS[plan.Status]}
                    color={STATUS_COLORS[plan.Status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={plan.IsPublic ? '是' : '否'}
                    color={plan.IsPublic ? 'primary' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {plan.TrialDays ? `${plan.TrialDays} 天` : '-'}
                </TableCell>
                <TableCell>{plan.SortOrder || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => onEdit(plan)}
                    title="编辑"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onToggleStatus(plan)}
                    title={plan.Status === 'active' ? '停用' : '激活'}
                    color={plan.Status === 'active' ? 'default' : 'primary'}
                  >
                    <PowerSettingsNewIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page - 1} // MUI uses 0-based index
        rowsPerPage={pageSize}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)} // Convert back to 1-based
        onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="每页条数:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count} 条`}
      />
    </Paper>
  );
};
