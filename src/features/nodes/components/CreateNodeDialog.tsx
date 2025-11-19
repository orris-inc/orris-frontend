/**
 * 创建节点对话框组件
 */

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  MenuItem,
} from '@mui/material';
import type { CreateNodeRequest } from '../types/nodes.types';

interface CreateNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateNodeRequest) => void;
}

// 常用加密方法
const ENCRYPTION_METHODS = [
  'aes-128-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'aes-128-cfb',
  'aes-256-cfb',
];

export const CreateNodeDialog: React.FC<CreateNodeDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateNodeRequest>({
    name: '',
    protocol: 'shadowsocks',
    server_address: '',
    server_port: 8388,
    method: 'aes-256-gcm',
    description: '',
    region: '',
    sort_order: 0,
    tags: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setFormData({
      name: '',
      protocol: 'shadowsocks',
      server_address: '',
      server_port: 8388,
      method: 'aes-256-gcm',
      description: '',
      region: '',
      sort_order: 0,
      tags: [],
    });
    setErrors({});
    onClose();
  };

  const handleChange = (field: keyof CreateNodeRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除该字段的错误
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

    if (!formData.name.trim()) {
      newErrors.name = '节点名称不能为空';
    }

    if (!formData.server_address.trim()) {
      newErrors.server_address = '服务器地址不能为空';
    }

    if (!formData.server_port || formData.server_port < 1 || formData.server_port > 65535) {
      newErrors.server_port = '端口必须在1-65535之间';
    }

    if (!formData.protocol) {
      newErrors.protocol = '协议类型不能为空';
    }

    if (!formData.method) {
      newErrors.method = '加密方法不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      // 清理undefined和空字符串
      const submitData: CreateNodeRequest = {
        name: formData.name.trim(),
        protocol: formData.protocol,
        server_address: formData.server_address.trim(),
        server_port: formData.server_port,
        method: formData.method,
      };

      if (formData.description?.trim()) {
        submitData.description = formData.description.trim();
      }
      if (formData.region?.trim()) {
        submitData.region = formData.region.trim();
      }
      if (formData.sort_order !== undefined) {
        submitData.sort_order = formData.sort_order;
      }

      onSubmit(submitData);
      handleClose();
    }
  };

  const isFormValid = formData.name.trim() &&
                      formData.protocol &&
                      formData.server_address.trim() &&
                      formData.server_port &&
                      formData.method;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>新增节点</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2.5}>
            {/* 节点名称 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="节点名称"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name || '必填项'}
                required
                size="small"
                autoFocus
              />
            </Grid>

            {/* 协议类型 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="协议类型"
                value={formData.protocol}
                onChange={(e) => handleChange('protocol', e.target.value)}
                error={!!errors.protocol}
                helperText={errors.protocol || '必填项'}
                required
                size="small"
              >
                <MenuItem value="shadowsocks">Shadowsocks</MenuItem>
                <MenuItem value="trojan">Trojan</MenuItem>
              </TextField>
            </Grid>

            {/* 服务器地址 */}
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="服务器地址"
                placeholder="example.com 或 IP 地址"
                value={formData.server_address}
                onChange={(e) => handleChange('server_address', e.target.value)}
                error={!!errors.server_address}
                helperText={errors.server_address || '必填项'}
                required
                size="small"
              />
            </Grid>

            {/* 端口 */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="端口"
                type="number"
                value={formData.server_port}
                onChange={(e) => handleChange('server_port', parseInt(e.target.value, 10))}
                error={!!errors.server_port}
                helperText={errors.server_port || '必填项，1-65535'}
                required
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
                value={formData.method}
                onChange={(e) => handleChange('method', e.target.value)}
                error={!!errors.method}
                helperText={errors.method || '必填项'}
                required
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
                placeholder="例如：东京"
                value={formData.region}
                onChange={(e) => handleChange('region', e.target.value)}
                size="small"
                helperText="可选"
              />
            </Grid>

            {/* 排序顺序 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="排序顺序"
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleChange('sort_order', parseInt(e.target.value, 10) || 0)}
                size="small"
                helperText="数字越小越靠前"
              />
            </Grid>

            {/* 描述 */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="描述"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                size="small"
                helperText="可选"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>取消</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid}
        >
          创建
        </Button>
      </DialogActions>
    </Dialog>
  );
};
