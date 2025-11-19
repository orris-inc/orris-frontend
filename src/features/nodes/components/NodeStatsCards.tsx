/**
 * 节点统计卡片组件
 */

import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BuildIcon from '@mui/icons-material/Build';
import ErrorIcon from '@mui/icons-material/Error';
import type { NodeListItem } from '../types/nodes.types';

interface NodeStatsCardsProps {
  nodes: NodeListItem[];
  loading?: boolean;
}

export const NodeStatsCards: React.FC<NodeStatsCardsProps> = ({ nodes, loading }) => {
  // 计算统计数据
  const stats = {
    total: nodes.length,
    active: nodes.filter(n => n.status === 'active').length,
    inactive: nodes.filter(n => n.status === 'inactive').length,
    maintenance: nodes.filter(n => n.status === 'maintenance').length,
    error: nodes.filter(n => n.status === 'error').length,
  };

  const statCards = [
    {
      title: '总节点数',
      value: stats.total,
      icon: <StorageIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    {
      title: '激活',
      value: stats.active,
      icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
    },
    {
      title: '未激活',
      value: stats.inactive,
      icon: <CancelIcon sx={{ fontSize: 40 }} />,
      color: '#757575',
      bgColor: '#f5f5f5',
    },
    {
      title: '维护中',
      value: stats.maintenance,
      icon: <BuildIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      bgColor: '#fff3e0',
    },
    {
      title: '错误',
      value: stats.error,
      icon: <ErrorIcon sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
      bgColor: '#ffebee',
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {statCards.map((stat, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card
            sx={{
              height: '100%',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3,
              }
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    backgroundColor: stat.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </Box>
              </Box>
              <Typography variant="h4" fontWeight="bold" color={stat.color}>
                {loading ? '-' : stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {stat.title}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
