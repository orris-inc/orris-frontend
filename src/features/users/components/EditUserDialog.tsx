/**
 * 编辑用户对话框组件
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
import type { UserListItem, UpdateUserRequest, UserStatus, UserRole } from '../types/users.types';

interface EditUserDialogProps {
  open: boolean;
  user: UserListItem | null;
  onClose: () => void;
  onSubmit: (id: number | string, data: UpdateUserRequest) => void;
}

// 状态选项
const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'active', label: '激活' },
  { value: 'inactive', label: '未激活' },
  { value: 'pending', label: '待处理' },
  { value: 'suspended', label: '暂停' },
];

// 角色选项
const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'user', label: '普通用户' },
  { value: 'admin', label: '管理员' },
];

export const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  user,
  onClose,
  onSubmit,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<UserStatus>('active');
  const [role, setRole] = useState<UserRole>('user');
  const [errors, setErrors] = useState<{email?: string; name?: string}>({});

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name);
      setStatus((user.status as UserStatus) || 'active');
      setRole((user.role as UserRole) || 'user');
      setErrors({});
    }
  }, [user]);

  const validate = () => {
    const newErrors: {email?: string; name?: string} = {};

    // 邮箱验证（如果填写了）
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '邮箱格式不正确';
    }

    // 姓名验证（如果填写了）
    if (name.trim() && (name.trim().length < 2 || name.trim().length > 100)) {
      newErrors.name = '姓名长度必须在2-100个字符之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (user && validate()) {
      // 只提交有变化的字段
      const updates: UpdateUserRequest = {};
      if (email !== user.email) updates.email = email;
      if (name !== user.name) updates.name = name;
      if (status !== user.status) updates.status = status;
      if (role !== user.role) updates.role = role;

      // 如果有任何变化，提交更新
      if (Object.keys(updates).length > 0) {
        onSubmit(user.id, updates);
      }
    }
  };

  // 检查是否有变化
  const hasChanges = user && (
    email !== user.email ||
    name !== user.name ||
    status !== user.status ||
    role !== user.role
  );

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>编辑用户</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2.5}>
            {/* 用户基本信息（只读） */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                基本信息
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="用户ID"
                value={user.id}
                disabled
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="创建时间"
                value={new Date(user.created_at).toLocaleString('zh-CN')}
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

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name || '长度2-100个字符'}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="状态"
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                size="small"
              >
                {STATUS_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="角色"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                size="small"
              >
                {ROLE_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
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
