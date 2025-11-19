/**
 * 订阅计划管理页面（管理端）
 */

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { PlanListTable } from '@/features/subscription-plans/components/PlanListTable';
import { PlanFilters } from '@/features/subscription-plans/components/PlanFilters';
import { CreatePlanDialog } from '@/features/subscription-plans/components/CreatePlanDialog';
import { EditPlanDialog } from '@/features/subscription-plans/components/EditPlanDialog';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { AdminLayout } from '@/layouts/AdminLayout';
import type { SubscriptionPlan } from '@/features/subscription-plans/types/subscription-plans.types';

export const SubscriptionPlansManagementPage = () => {
  const {
    plans,
    pagination,
    filters,
    loading,
    fetchPlans,
    createPlan,
    updatePlan,
    togglePlanStatus,
    setFilters,
  } = useSubscriptionPlans();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const handlePageChange = (page: number) => {
    fetchPlans(page, pagination.page_size);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchPlans(1, pageSize);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setEditDialogOpen(true);
  };

  const handleToggleStatus = async (plan: SubscriptionPlan) => {
    await togglePlanStatus(plan.ID, plan.Status);
  };

  const handleCreateSubmit = async (data: any) => {
    const result = await createPlan(data);
    if (result) {
      setCreateDialogOpen(false);
    }
  };

  const handleUpdateSubmit = async (id: number, data: any) => {
    const result = await updatePlan(id, data);
    if (result) {
      setEditDialogOpen(false);
      setSelectedPlan(null);
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box py={4}>
          {/* 页面标题 */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                订阅计划管理
              </Typography>
              <Typography variant="body2" color="text.secondary">
                管理所有订阅计划和定价方案
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              size="large"
            >
              创建计划
            </Button>
          </Box>

          {/* 筛选器 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <PlanFilters filters={filters} onChange={setFilters} />
          </Paper>

          {/* 计划列表表格 */}
          <PlanListTable
            plans={plans}
            loading={loading}
            page={pagination.page}
            pageSize={pagination.page_size}
            total={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
          />

          {/* 创建计划对话框 */}
          <CreatePlanDialog
            open={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            onSubmit={handleCreateSubmit}
          />

          {/* 编辑计划对话框 */}
          <EditPlanDialog
            open={editDialogOpen}
            plan={selectedPlan}
            onClose={() => {
              setEditDialogOpen(false);
              setSelectedPlan(null);
            }}
            onSubmit={handleUpdateSubmit}
          />
        </Box>
      </Container>
    </AdminLayout>
  );
};
