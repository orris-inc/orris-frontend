/**
 * 账户状态卡片
 */

import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import type { User } from '@/features/auth/types/auth.types';

interface AccountStatusCardProps {
  user: User;
}

export const AccountStatusCard = ({ user }: AccountStatusCardProps) => {
  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          账户状态
        </Typography>

        <List disablePadding>
          {/* 账户ID */}
          <ListItem disablePadding sx={{ py: 1.5 }}>
            <ListItemText
              primary="账户 ID"
              secondary={user.id}
              primaryTypographyProps={{
                variant: 'body2',
                color: 'text.secondary',
              }}
              secondaryTypographyProps={{
                variant: 'body2',
                fontWeight: 500,
                sx: { fontFamily: 'monospace', fontSize: '0.875rem' },
              }}
            />
          </ListItem>

          {/* 邮箱验证状态 */}
          <ListItem disablePadding sx={{ py: 1.5 }}>
            <ListItemText
              primary="邮箱验证"
              primaryTypographyProps={{
                variant: 'body2',
                color: 'text.secondary',
              }}
            />
            <Box>
              {user.email_verified ? (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="body2" color="success.main" fontWeight={500}>
                    已验证
                  </Typography>
                </Stack>
              ) : (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <WarningIcon color="warning" fontSize="small" />
                  <Typography variant="body2" color="warning.main" fontWeight={500}>
                    未验证
                  </Typography>
                </Stack>
              )}
            </Box>
          </ListItem>

          {/* OAuth提供商 */}
          {user.oauth_provider && (
            <ListItem disablePadding sx={{ py: 1.5 }}>
              <ListItemText
                primary="登录方式"
                primaryTypographyProps={{
                  variant: 'body2',
                  color: 'text.secondary',
                }}
              />
              <Chip
                label={user.oauth_provider.toUpperCase()}
                size="small"
                color="primary"
                sx={{ textTransform: 'capitalize' }}
              />
            </ListItem>
          )}

          {/* 最后更新时间 - 仅在有数据时显示 */}
          {user.updated_at && (
            <ListItem disablePadding sx={{ py: 1.5 }}>
              <ListItemText
                primary="最后更新"
                secondary={new Date(user.updated_at).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                primaryTypographyProps={{
                  variant: 'body2',
                  color: 'text.secondary',
                }}
                secondaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 500,
                }}
              />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );
};
