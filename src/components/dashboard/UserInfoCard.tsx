/**
 * 用户个人信息卡片
 */

import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Stack,
  Box,
  Chip,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import type { User } from '@/features/auth/types/auth.types';

interface UserInfoCardProps {
  user: User;
}

export const UserInfoCard = ({ user }: UserInfoCardProps) => {
  const displayName = user.display_name || user.name || user.email?.split('@')[0] || '用户';
  const avatarText = user.initials || user.display_name?.charAt(0).toUpperCase() || user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase();

  return (
    <Card elevation={2}>
      <CardContent>
        <Stack spacing={3} alignItems="center">
          {/* 用户头像 */}
          <Avatar
            src={user.avatar}
            alt={displayName}
            sx={{
              width: 100,
              height: 100,
              fontSize: '2.5rem',
              bgcolor: 'primary.main',
              border: '4px solid',
              borderColor: 'background.paper',
              boxShadow: 3,
            }}
          >
            {avatarText}
          </Avatar>

          {/* 用户名 */}
          <Box textAlign="center" width="100%">
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
              <Typography variant="h5" fontWeight="bold">
                {displayName}
              </Typography>
              {user.email_verified && (
                <VerifiedIcon color="primary" fontSize="small" />
              )}
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {user.email}
            </Typography>
          </Box>

          {/* OAuth标签 */}
          {user.oauth_provider && (
            <Chip
              label={`${user.oauth_provider.toUpperCase()} 账号`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}

          {/* 加入时间 */}
          <Box width="100%" sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              加入时间
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {new Date(user.created_at).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};
