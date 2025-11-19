/**
 * 用户资料卡片（合并版）
 * 整合用户个人信息和账户状态
 */

import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Stack,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import SettingsIcon from '@mui/icons-material/Settings';
import type { User } from '@/features/auth/types/auth.types';
import { useNavigate } from 'react-router-dom';

interface UserProfileCardProps {
  user: User;
}

export const UserProfileCard = ({ user }: UserProfileCardProps) => {
  const navigate = useNavigate();
  const displayName = user.display_name || user.name || user.email?.split('@')[0] || '用户';
  const avatarText =
    user.initials ||
    user.display_name?.charAt(0).toUpperCase() ||
    user.name?.charAt(0).toUpperCase() ||
    user.email?.charAt(0).toUpperCase();

  return (
    <Card elevation={2}>
      <CardContent>
        <Stack spacing={2.5}>
          {/* 头部：头像 + 基本信息 */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={user.avatar}
              alt={displayName}
              sx={{
                width: 72,
                height: 72,
                fontSize: '2rem',
                bgcolor: 'primary.main',
                border: '3px solid',
                borderColor: 'background.paper',
                boxShadow: 2,
              }}
            >
              {avatarText}
            </Avatar>

            <Box flex={1}>
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <Typography variant="h6" fontWeight="bold">
                  {displayName}
                </Typography>
                {user.email_verified && (
                  <Tooltip title="邮箱已验证">
                    <VerifiedIcon color="primary" fontSize="small" />
                  </Tooltip>
                )}
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {user.email}
              </Typography>

              {/* OAuth 标签 */}
              {user.oauth_provider && (
                <Chip
                  label={`${user.oauth_provider.toUpperCase()} 登录`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>

            {/* 设置按钮 */}
            <Tooltip title="个人设置">
              <IconButton
                onClick={() => navigate('/profile/settings')}
                sx={{
                  alignSelf: 'flex-start',
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* 分隔线 */}
          <Box sx={{ borderTop: 1, borderColor: 'divider' }} />

          {/* 账户详细信息 */}
          <List disablePadding dense>
            {/* 账户ID */}
            <ListItem disablePadding sx={{ py: 0.5 }}>
              <ListItemText
                primary="账户 ID"
                primaryTypographyProps={{
                  variant: 'body2',
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              />
              <Typography
                variant="body2"
                sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
              >
                {String(user.id).substring(0, 8)}...
              </Typography>
            </ListItem>

            {/* 加入时间 */}
            <ListItem disablePadding sx={{ py: 0.5 }}>
              <ListItemText
                primary="加入时间"
                primaryTypographyProps={{
                  variant: 'body2',
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              />
              <Typography variant="body2">
                {new Date(user.created_at).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>
            </ListItem>

            {/* 最后更新 */}
            {user.updated_at && (
              <ListItem disablePadding sx={{ py: 0.5 }}>
                <ListItemText
                  primary="最后更新"
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: 'text.secondary',
                    fontWeight: 500,
                  }}
                />
                <Typography variant="body2">
                  {new Date(user.updated_at).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </Typography>
              </ListItem>
            )}
          </List>
        </Stack>
      </CardContent>
    </Card>
  );
};
