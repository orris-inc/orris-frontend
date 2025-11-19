/**
 * 计划功能列表组件
 */

import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface PlanFeatureListProps {
  features: string[];
}

export const PlanFeatureList: React.FC<PlanFeatureListProps> = ({ features }) => {
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <List dense>
      {features.map((feature, index) => (
        <ListItem key={index} disableGutters>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <CheckCircleIcon color="primary" fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={feature} />
        </ListItem>
      ))}
    </List>
  );
};
