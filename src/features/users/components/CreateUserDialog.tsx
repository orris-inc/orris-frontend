/**
 * 创建用户对话框组件
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
} from '@mui/material';
import type { CreateUserRequest } from '../types/users.types';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest) => void;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{email?: string; name?: string}>({});

  const handleClose = () => {
    setEmail('');
    setName('');
    setErrors({});
    onClose();
  };

  const validate = () => {
    const newErrors: {email?: string; name?: string} = {};

    if (!email.trim()) {
      newErrors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '邮箱格式不正确';
    }

    if (!name.trim()) {
      newErrors.name = '姓名不能为空';
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      newErrors.name = '姓名长度必须在2-100个字符之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({ email: email.trim(), name: name.trim() });
      handleClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>新增用户</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                helperText={errors.email || '必填项'}
                required
                size="small"
                autoFocus
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name || '必填项，长度2-100个字符'}
                required
                size="small"
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
          disabled={!email.trim() || !name.trim()}
        >
          创建
        </Button>
      </DialogActions>
    </Dialog>
  );
};
