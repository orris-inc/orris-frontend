import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  TextField,
  Stack,
  Typography,
  Chip,
  Alert,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Verified, Email, Warning } from '@mui/icons-material';
import { useProfile } from '../hooks/useProfile';
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from '../types/profile.types';
import type { User } from '@/features/auth/types/auth.types';

interface BasicInfoTabProps {
  user: User;
}

/**
 * 基本信息Tab
 */
export const BasicInfoTab = ({ user }: BasicInfoTabProps) => {
  const { updateProfile, isLoading } = useProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name || user.display_name || '',
      email: user.email || '',
    },
  });

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      // 只发送有值的字段
      const payload: UpdateProfileFormData = {};
      if (data.name && data.name.trim()) {
        payload.name = data.name.trim();
      }
      if (data.email && data.email.trim() && data.email !== user.email) {
        payload.email = data.email.trim();
      }

      await updateProfile(payload);
    } catch (error) {
      // 错误已在useProfile中处理
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      {/* 基本信息表单 */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3}>
          {/* 用户名 */}
          <TextField
            {...register('name')}
            label="用户名"
            error={!!errors.name}
            helperText={errors.name?.message || '2-100个字符'}
            fullWidth
          />

          {/* 邮箱 */}
          <Box>
            <TextField
              {...register('email')}
              label="邮箱"
              type="email"
              error={!!errors.email}
              helperText={errors.email?.message || '修改邮箱后需要重新验证'}
              fullWidth
              InputProps={{
                startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
            <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
              {user.email_verified ? (
                <Chip
                  label="已验证"
                  size="small"
                  color="success"
                  icon={<Verified />}
                />
              ) : (
                <Chip
                  label="未验证"
                  size="small"
                  color="warning"
                  icon={<Warning />}
                />
              )}
            </Box>
          </Box>

          {/* 显示名称（只读，由后端生成） */}
          {user.display_name && (
            <TextField
              label="显示名称"
              value={user.display_name}
              fullWidth
              disabled
              helperText="由系统自动生成"
            />
          )}

          {/* 用户标识（只读） */}
          {user.initials && (
            <TextField
              label="姓名首字母"
              value={user.initials}
              fullWidth
              disabled
              helperText="由系统自动生成"
            />
          )}

          {/* 账号状态 */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              账号状态
            </Typography>
            <Chip
              label={
                user.status === 'active'
                  ? '正常'
                  : user.status === 'inactive'
                  ? '未激活'
                  : user.status === 'suspended'
                  ? '已暂停'
                  : user.status === 'pending'
                  ? '待处理'
                  : '未知'
              }
              size="small"
              color={user.status === 'active' ? 'success' : 'default'}
            />
          </Box>

          {/* OAuth提供商 */}
          {user.oauth_provider && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                登录方式
              </Typography>
              <Chip
                label={
                  user.oauth_provider === 'google'
                    ? 'Google'
                    : user.oauth_provider === 'github'
                    ? 'GitHub'
                    : user.oauth_provider
                }
                size="small"
                color="primary"
              />
            </Box>
          )}

          {/* 注册时间 */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              注册时间
            </Typography>
            <Typography variant="body2">
              {new Date(user.created_at).toLocaleString('zh-CN')}
            </Typography>
          </Box>

          {/* 最后更新时间 */}
          {user.updated_at && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                最后更新
              </Typography>
              <Typography variant="body2">
                {new Date(user.updated_at).toLocaleString('zh-CN')}
              </Typography>
            </Box>
          )}

          {/* 邮箱修改提醒 */}
          {isDirty && (
            <Alert severity="info" icon={<Email />}>
              修改邮箱地址后需要重新验证，请查收验证邮件
            </Alert>
          )}

          {/* 保存按钮 */}
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isLoading}
            disabled={!isDirty}
            fullWidth
          >
            保存更改
          </LoadingButton>
        </Stack>
      </Box>
    </Box>
  );
};
