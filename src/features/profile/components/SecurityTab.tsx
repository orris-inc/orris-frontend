import { Box, Typography, Paper, Divider } from '@mui/material';
import { ChangePasswordForm } from './ChangePasswordForm';

/**
 * 安全设置Tab
 */
export const SecurityTab = () => {
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        修改密码
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        设置一个强密码以保护您的账号安全
      </Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <ChangePasswordForm />
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* OAuth绑定管理（占位） */}
      <Box>
        <Typography variant="h6" gutterBottom>
          OAuth账号绑定
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          绑定OAuth账号后可使用快捷登录
        </Typography>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OAuth绑定管理功能即将推出
          </Typography>
        </Paper>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* 危险操作区域（占位） */}
      <Box>
        <Typography variant="h6" color="error" gutterBottom>
          危险操作
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          这些操作将永久影响您的账号
        </Typography>

        <Paper variant="outlined" sx={{ p: 3, borderColor: 'error.main' }}>
          <Typography variant="body2" color="text.secondary">
            账号注销功能即将推出
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};
