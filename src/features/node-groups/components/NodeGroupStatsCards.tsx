/**
 * 节点组统计卡片组件
 */

import { Grid, Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import type { NodeGroupListItem } from '../types/node-groups.types';

interface NodeGroupStatsCardsProps {
  nodeGroups: NodeGroupListItem[];
  loading?: boolean;
}

export const NodeGroupStatsCards = ({ nodeGroups, loading = false }: NodeGroupStatsCardsProps) => {
  // 计算统计数据
  const stats = {
    total: nodeGroups.length,
    public: nodeGroups.filter((g) => g.is_public).length,
    private: nodeGroups.filter((g) => !g.is_public).length,
  };

  const cards = [
    {
      title: '总节点组数',
      value: stats.total,
      icon: <GroupsIcon sx={{ fontSize: 40 }} />,
      color: 'primary.main',
      bgColor: 'primary.light',
    },
    {
      title: '公开节点组',
      value: stats.public,
      icon: <PublicIcon sx={{ fontSize: 40 }} />,
      color: 'success.main',
      bgColor: 'success.light',
    },
    {
      title: '私有节点组',
      value: stats.private,
      icon: <LockIcon sx={{ fontSize: 40 }} />,
      color: 'warning.main',
      bgColor: 'warning.light',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {cards.map((card, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {card.title}
                  </Typography>
                  {loading ? (
                    <Skeleton width={60} height={40} />
                  ) : (
                    <Typography variant="h4" fontWeight="bold">
                      {card.value}
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    bgcolor: card.bgColor,
                    color: card.color,
                    opacity: 0.8,
                  }}
                >
                  {card.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
