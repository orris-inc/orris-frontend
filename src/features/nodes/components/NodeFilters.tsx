/**
 * 节点筛选器组件
 * 支持：状态、地区、标签、排序
 */

import { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Grid,
  Autocomplete,
  Chip,
  Typography,
  Collapse,
} from '@mui/material';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { NodeFilters as NodeFiltersType, NodeStatus } from '../types/nodes.types';

interface NodeFiltersComponentProps {
  filters: NodeFiltersType;
  onChange: (filters: Partial<NodeFiltersType>) => void;
}

// 排序字段选项
const ORDER_BY_OPTIONS = [
  { value: 'sort_order', label: '排序顺序' },
  { value: 'created_at', label: '创建时间' },
  { value: 'updated_at', label: '更新时间' },
  { value: 'name', label: '节点名称' },
  { value: 'region', label: '地区' },
  { value: 'status', label: '状态' },
];

// 常用地区选项（可根据实际情况调整）
const REGION_OPTIONS = [
  '美国',
  '日本',
  '香港',
  '新加坡',
  '英国',
  '德国',
  '法国',
  '加拿大',
  '澳大利亚',
  '韩国',
  '台湾',
  '其他',
];

// 常用标签选项（可根据实际情况调整）
const TAG_OPTIONS = [
  'premium',
  'fast',
  'stable',
  'game',
  'video',
  'cn2',
  'gia',
  'iplc',
  'iepl',
  'bgp',
];

export const NodeFilters: React.FC<NodeFiltersComponentProps> = ({ filters, onChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleStatusChange = (value: string) => {
    onChange({ status: value ? (value as NodeStatus) : undefined });
  };

  const handleRegionChange = (value: string) => {
    onChange({ region: value || undefined });
  };

  const handleTagsChange = (value: string[]) => {
    onChange({ tags: value.length > 0 ? value : undefined });
  };

  const handleOrderByChange = (value: string) => {
    onChange({ order_by: value || undefined });
  };

  const handleOrderChange = (value: string) => {
    onChange({ order: value ? (value as 'asc' | 'desc') : undefined });
  };

  const handleSearchChange = (value: string) => {
    onChange({ search: value });
  };

  const handleReset = () => {
    onChange({
      status: undefined,
      region: undefined,
      tags: undefined,
      order_by: undefined,
      order: undefined,
      search: '',
    });
    setShowAdvanced(false);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          筛选条件
        </Typography>
        <Button
          size="small"
          startIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? '收起' : '展开'}高级筛选
        </Button>
      </Box>

      <Grid container spacing={2} alignItems="flex-start">
        {/* 基础筛选 */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
            <MenuItem value="maintenance">维护中</MenuItem>
            <MenuItem value="error">错误</MenuItem>
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Autocomplete
            freeSolo
            options={REGION_OPTIONS}
            value={filters.region || ''}
            onChange={(_, value) => handleRegionChange(value || '')}
            onInputChange={(_, value) => handleRegionChange(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="地区"
                placeholder="选择或输入地区"
                size="small"
              />
            )}
            size="small"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 8, md: 4 }}>
          <TextField
            fullWidth
            label="搜索"
            placeholder="名称或服务器地址"
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            size="small"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
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

        {/* 高级筛选 */}
        <Grid size={{ xs: 12 }}>
          <Collapse in={showAdvanced}>
            <Box mt={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={TAG_OPTIONS}
                    value={filters.tags || []}
                    onChange={(_, value) => handleTagsChange(value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="标签"
                        placeholder="选择或输入标签"
                        size="small"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          label={option}
                          size="small"
                        />
                      ))
                    }
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="排序字段"
                    value={filters.order_by || 'sort_order'}
                    onChange={(e) => handleOrderByChange(e.target.value)}
                    size="small"
                  >
                    {ORDER_BY_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="排序方向"
                    value={filters.order || 'asc'}
                    onChange={(e) => handleOrderChange(e.target.value)}
                    size="small"
                  >
                    <MenuItem value="asc">升序</MenuItem>
                    <MenuItem value="desc">降序</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Grid>
      </Grid>
    </Box>
  );
};
