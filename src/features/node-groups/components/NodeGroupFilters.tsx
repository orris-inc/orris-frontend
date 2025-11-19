/**
 * 节点组筛选器组件
 */

import { Box, FormControl, InputLabel, Select, MenuItem, TextField, Button, Typography } from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import type { NodeGroupFilters as NodeGroupFiltersType } from '../types/node-groups.types';

interface NodeGroupFiltersProps {
  filters: NodeGroupFiltersType;
  onChange: (filters: Partial<NodeGroupFiltersType>) => void;
}

export const NodeGroupFilters = ({ filters, onChange }: NodeGroupFiltersProps) => {
  const handlePublicChange = (value: string) => {
    onChange({
      is_public: value === '' ? undefined : value === 'true',
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ search: event.target.value });
  };

  const handleReset = () => {
    onChange({ is_public: undefined, search: '' });
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <FilterAltIcon color="action" />
        <Typography variant="h6">筛选条件</Typography>
      </Box>

      <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
        {/* 公开性筛选 */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>公开性</InputLabel>
          <Select
            value={filters.is_public === undefined ? '' : String(filters.is_public)}
            onChange={(e) => handlePublicChange(e.target.value)}
            label="公开性"
          >
            <MenuItem value="">全部</MenuItem>
            <MenuItem value="true">公开</MenuItem>
            <MenuItem value="false">私有</MenuItem>
          </Select>
        </FormControl>

        {/* 搜索框 */}
        <TextField
          size="small"
          label="搜索"
          placeholder="搜索名称或描述"
          value={filters.search || ''}
          onChange={handleSearchChange}
          sx={{ minWidth: 250 }}
        />

        {/* 重置按钮 */}
        <Button
          variant="outlined"
          onClick={handleReset}
          disabled={!filters.is_public && !filters.search}
        >
          重置
        </Button>
      </Box>
    </Box>
  );
};
