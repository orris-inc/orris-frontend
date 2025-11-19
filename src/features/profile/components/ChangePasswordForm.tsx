import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  LinearProgress,
  Typography,
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Visibility, VisibilityOff, Devices } from '@mui/icons-material';
import { useProfile } from '../hooks/useProfile';
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from '../types/profile.types';

/**
 * 计算密码强度
 */
const calculatePasswordStrength = (password: string): number => {
  let strength = 0;

  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/\d/.test(password)) strength += 25;

  return strength;
};

/**
 * 获取密码强度颜色
 */
const getStrengthColor = (strength: number): string => {
  if (strength < 25) return 'error';
  if (strength < 50) return 'warning';
  if (strength < 75) return 'info';
  return 'success';
};

/**
 * 获取密码强度文本
 */
const getStrengthText = (strength: number): string => {
  if (strength < 25) return '弱';
  if (strength < 50) return '中';
  if (strength < 75) return '良';
  return '强';
};

/**
 * 修改密码表单
 */
export const ChangePasswordForm = () => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordStrength, setNewPasswordStrength] = useState(0);

  const { changePassword, isLoading } = useProfile();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      logout_all_devices: false,
    },
  });

  const newPassword = watch('new_password');

  // 监听新密码变化，更新强度指示器
  useState(() => {
    if (newPassword) {
      setNewPasswordStrength(calculatePasswordStrength(newPassword));
    } else {
      setNewPasswordStrength(0);
    }
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePassword(data);
      reset(); // 清空表单
    } catch (error) {
      // 错误已在useProfile中处理
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      {/* 当前密码 */}
      <TextField
        {...register('old_password')}
        type={showOldPassword ? 'text' : 'password'}
        label="当前密码"
        error={!!errors.old_password}
        helperText={errors.old_password?.message}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowOldPassword(!showOldPassword)}
                edge="end"
              >
                {showOldPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* 新密码 */}
      <Box>
        <TextField
          {...register('new_password')}
          type={showNewPassword ? 'text' : 'password'}
          label="新密码"
          fullWidth
          error={!!errors.new_password}
          helperText={errors.new_password?.message}
          onChange={(e) => {
            register('new_password').onChange(e);
            setNewPasswordStrength(calculatePasswordStrength(e.target.value));
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  edge="end"
                >
                  {showNewPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* 密码强度指示器 */}
        {newPassword && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={newPasswordStrength}
              color={getStrengthColor(newPasswordStrength) as any}
              sx={{ height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color="text.secondary">
              密码强度：{getStrengthText(newPasswordStrength)}
            </Typography>
          </Box>
        )}
      </Box>

      {/* 确认新密码 */}
      <TextField
        {...register('confirm_password')}
        type={showConfirmPassword ? 'text' : 'password'}
        label="确认新密码"
        error={!!errors.confirm_password}
        helperText={errors.confirm_password?.message}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                edge="end"
              >
                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* 登出所有设备选项 */}
      <Box>
        <FormControlLabel
          control={
            <Checkbox
              {...register('logout_all_devices')}
              icon={<Devices />}
              checkedIcon={<Devices />}
            />
          }
          label={
            <Box>
              <Typography variant="body2">登出所有设备</Typography>
              <Typography variant="caption" color="text.secondary">
                修改密码后，强制其他设备重新登录
              </Typography>
            </Box>
          }
        />
      </Box>

      {/* 安全提示 */}
      <Alert severity="warning">
        修改密码后，如果选择"登出所有设备"，您需要在所有设备上重新登录
      </Alert>

      {/* 提交按钮 */}
      <LoadingButton
        type="submit"
        variant="contained"
        loading={isLoading}
        sx={{ mt: 1 }}
      >
        修改密码
      </LoadingButton>
    </Box>
  );
};
