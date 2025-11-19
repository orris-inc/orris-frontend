/**
 * 快捷操作卡片
 */

import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export const QuickActionsCard = () => {
  const actions = [
    {
      icon: <PersonIcon />,
      title: '编辑个人资料',
      description: '更新您的姓名和头像',
      disabled: true,
    },
    {
      icon: <LockIcon />,
      title: '修改密码',
      description: '更改您的登录密码',
      disabled: true,
    },
    {
      icon: <NotificationsIcon />,
      title: '通知设置',
      description: '管理通知偏好',
      disabled: true,
    },
    {
      icon: <SettingsIcon />,
      title: '账户设置',
      description: '高级账户选项',
      disabled: true,
    },
  ];

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          快捷操作
        </Typography>

        <List disablePadding>
          {actions.map((action, index) => (
            <ListItem
              key={index}
              disablePadding
              secondaryAction={
                <ChevronRightIcon color={action.disabled ? 'disabled' : 'action'} />
              }
            >
              <ListItemButton disabled={action.disabled} sx={{ borderRadius: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>{action.icon}</ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={500}>
                      {action.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {action.description}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2, textAlign: 'center', fontStyle: 'italic' }}
        >
          更多功能即将推出
        </Typography>
      </CardContent>
    </Card>
  );
};
