/**
 * 快速链接卡片
 * 提供实用的导航链接
 */

import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import StorageIcon from '@mui/icons-material/Storage';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/auth-store';

interface QuickLink {
  icon: React.ReactNode;
  title: string;
  description: string;
  path?: string; // 可选，如果没有则表示待实现
  adminOnly?: boolean;
  implemented: boolean; // 是否已实现
}

export const QuickLinks = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const links: QuickLink[] = [
    {
      icon: <PersonIcon />,
      title: '个人设置',
      description: '管理您的个人信息和偏好',
      path: '/dashboard/profile',
      implemented: true,
    },
    {
      icon: <SubscriptionsIcon />,
      title: '订阅管理',
      description: '查看和管理您的订阅计划',
      implemented: false, // 待实现
    },
    {
      icon: <StorageIcon />,
      title: '节点管理',
      description: '管理您的节点配置',
      path: '/admin/nodes',
      adminOnly: true,
      implemented: true,
    },
    {
      icon: <LocalOfferIcon />,
      title: '价格方案',
      description: '浏览可用的订阅套餐',
      path: '/pricing',
      implemented: true,
    },
  ];

  // 根据用户权限过滤链接
  const visibleLinks = links.filter((link) => !link.adminOnly || isAdmin);

  const handleLinkClick = (link: QuickLink) => {
    if (link.implemented && link.path) {
      navigate(link.path);
    }
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          快速访问
        </Typography>

        <Stack spacing={1.5}>
          {visibleLinks.map((link, index) => (
            <Button
              key={index}
              onClick={() => handleLinkClick(link)}
              variant="outlined"
              disabled={!link.implemented}
              sx={{
                justifyContent: 'space-between',
                textAlign: 'left',
                p: 2,
                height: 'auto',
                textTransform: 'none',
                borderColor: 'divider',
                opacity: link.implemented ? 1 : 0.5,
                cursor: link.implemented ? 'pointer' : 'not-allowed',
                '&:hover': link.implemented
                  ? {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    }
                  : {},
              }}
              endIcon={link.implemented ? <ArrowForwardIcon /> : null}
            >
              <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: link.implemented ? 'action.hover' : 'action.disabledBackground',
                    color: link.implemented ? 'text.primary' : 'action.disabled',
                  }}
                >
                  {link.icon}
                </Box>
                <Box flex={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color={link.implemented ? 'text.primary' : 'text.disabled'}
                    >
                      {link.title}
                    </Typography>
                    {!link.implemented && (
                      <Chip
                        label="待实现"
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Stack>
                  <Typography
                    variant="caption"
                    color={link.implemented ? 'text.secondary' : 'text.disabled'}
                  >
                    {link.description}
                  </Typography>
                </Box>
              </Stack>
            </Button>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
