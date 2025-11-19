/**
 * 编辑节点对话框组件
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import type { NodeListItem, UpdateNodeRequest } from '../types/nodes.types';

interface EditNodeDialogProps {
  open: boolean;
  node: NodeListItem | null;
  onClose: () => void;
  onSubmit: (id: number | string, data: UpdateNodeRequest) => void;
}

// 常用加密方法
const ENCRYPTION_METHODS = [
  'aes-128-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'aes-128-cfb',
  'aes-256-cfb',
];

export const EditNodeDialog: React.FC<EditNodeDialogProps> = ({
  open,
  node,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UpdateNodeRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (node) {
      // 如果节点状态是error，默认设置为inactive（因为UpdateNodeRequest不支持error状态）
      const editableStatus = node.status === 'error' ? 'inactive' : node.status as 'active' | 'inactive' | 'maintenance';

      setFormData({
        name: node.name,
        description: node.description,
        server_address: node.server_address,
        server_port: node.server_port,
        method: node.method,
        region: node.region,
        status: editableStatus,
        sort_order: node.sort_order,
      });
      setErrors({});
    }
  }, [node]);

  const handleChange = (field: keyof UpdateNodeRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name !== undefined && !formData.name.trim()) {
      newErrors.name = '节点名称不能为空';
    }

    if (formData.server_address !== undefined && !formData.server_address.trim()) {
      newErrors.server_address = '服务器地址不能为空';
    }

    if (formData.server_port !== undefined && (formData.server_port < 1 || formData.server_port > 65535)) {
      newErrors.server_port = '端口必须在1-65535之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (node && validate()) {
      // 只提交有变化的字段
      const updates: UpdateNodeRequest = {};

      if (formData.name !== node.name) updates.name = formData.name;
      if (formData.description !== node.description) updates.description = formData.description;
      if (formData.server_address !== node.server_address) updates.server_address = formData.server_address;
      if (formData.server_port !== node.server_port) updates.server_port = formData.server_port;
      if (formData.method !== node.method) updates.method = formData.method;
      if (formData.region !== node.region) updates.region = formData.region;
      if (formData.status !== node.status) updates.status = formData.status as any;
      if (formData.sort_order !== node.sort_order) updates.sort_order = formData.sort_order;

      // 如果有任何变化，提交更新
      if (Object.keys(updates).length > 0) {
        onSubmit(node.id, updates);
      }
    }
  };

  // 检查是否有变化
  const hasChanges = node && Object.keys(formData).some(
    (key) => formData[key as keyof UpdateNodeRequest] !== node[key as keyof NodeListItem]
  );

  if (!node) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>编辑节点</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2.5}>
            {/* 节点基本信息（只读） */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                基本信息
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="节点ID"
                value={node.id}
                disabled
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="创建时间"
                value={new Date(node.created_at).toLocaleString('zh-CN')}
                disabled
                size="small"
              />
            </Grid>

            {/* 可编辑字段 */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                可编辑信息
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* 节点名称 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="节点名称"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                size="small"
              />
            </Grid>

            {/* 协议类型（只读） */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="协议类型"
                value={node.protocol === 'shadowsocks' ? 'Shadowsocks' : 'Trojan'}
                disabled
                size="small"
                helperText="协议创建后不可修改"
              />
            </Grid>

            {/* 状态 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="状态"
                value={formData.status || 'inactive'}
                onChange={(e) => handleChange('status', e.target.value)}
                size="small"
                helperText={node.status === 'error' ? '原状态为错误，已自动设置为未激活' : ''}
              >
                <MenuItem value="active">激活</MenuItem>
                <MenuItem value="inactive">未激活</MenuItem>
                <MenuItem value="maintenance">维护中</MenuItem>
              </TextField>
            </Grid>

            {/* 服务器地址 */}
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="服务器地址"
                value={formData.server_address || ''}
                onChange={(e) => handleChange('server_address', e.target.value)}
                error={!!errors.server_address}
                helperText={errors.server_address}
                size="small"
              />
            </Grid>

            {/* 端口 */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="端口"
                type="number"
                value={formData.server_port || ''}
                onChange={(e) => handleChange('server_port', parseInt(e.target.value, 10))}
                error={!!errors.server_port}
                helperText={errors.server_port}
                size="small"
                slotProps={{
                  htmlInput: { min: 1, max: 65535 }
                }}
              />
            </Grid>

            {/* 加密方法 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="加密方法"
                value={formData.method || ''}
                onChange={(e) => handleChange('method', e.target.value)}
                size="small"
              >
                {ENCRYPTION_METHODS.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* 地区 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="地区"
                value={formData.region || ''}
                onChange={(e) => handleChange('region', e.target.value)}
                size="small"
              />
            </Grid>

            {/* 排序顺序 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="排序顺序"
                type="number"
                value={formData.sort_order ?? 0}
                onChange={(e) => handleChange('sort_order', parseInt(e.target.value, 10) || 0)}
                size="small"
              />
            </Grid>

            {/* 描述 */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="描述"
                multiline
                rows={2}
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!hasChanges}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};
