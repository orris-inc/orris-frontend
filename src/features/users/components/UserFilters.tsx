/**
 * 用户筛选器组件
 */

import { Box, TextField, MenuItem, Button, Grid } from '@mui/material';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import type { UserFilters as UserFiltersType, UserStatus, UserRole } from '../types/users.types';

interface UserFiltersComponentProps {
  filters: UserFiltersType;
  onChange: (filters: Partial<UserFiltersType>) => void;
}

export const UserFilters: React.FC<UserFiltersComponentProps> = ({ filters, onChange }) => {
  const handleStatusChange = (value: string) => {
    onChange({ status: value ? (value as UserStatus) : undefined });
  };

  const handleRoleChange = (value: string) => {
    onChange({ role: value ? (value as UserRole) : undefined });
  };

  const handleSearchChange = (value: string) => {
    onChange({ search: value });
  };

  const handleReset = () => {
    onChange({ status: undefined, role: undefined, search: '' });
  };

  return (
    <Box>
      <Grid container spacing={2} alignItems="center">
        {/* 状态筛选 */}
        <Grid size={{ xs: 12, sm: 4, md: 3 }}>
          <TextField
            select
            fullWidth
            label="状态"
            value={filters.status || ''}
            onChange={(e) => handleStatusChange(e.target.value)}
            size="small"
          >
            <MenuItem value="">全部</MenuItem>
            <MenuItem value="active">激活</MenuItem>
            <MenuItem value="inactive">未激活</MenuItem>
            <MenuItem value="pending">待处理</MenuItem>
            <MenuItem value="suspended">暂停</MenuItem>
          </TextField>
        </Grid>

        {/* 角色筛选 */}
        <Grid size={{ xs: 12, sm: 4, md: 3 }}>
          <TextField
            select
            fullWidth
            label="角色"
            value={filters.role || ''}
            onChange={(e) => handleRoleChange(e.target.value)}
            size="small"
          >
            <MenuItem value="">全部</MenuItem>
            <MenuItem value="user">普通用户</MenuItem>
            <MenuItem value="admin">管理员</MenuItem>
          </TextField>
        </Grid>

        {/* 关键词搜索 */}
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <TextField
            fullWidth
            label="搜索"
            placeholder="邮箱或姓名"
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            size="small"
          />
        </Grid>

        {/* 重置按钮 */}
        <Grid size={{ xs: 12, sm: 12, md: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FilterListOffIcon />}
            onClick={handleReset}
            size="medium"
          >
            重置
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
