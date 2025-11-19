import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { BasicInfoTab } from './BasicInfoTab';
import { SecurityTab } from './SecurityTab';
import { useAuthStore } from '@/features/auth/stores/auth-store';

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * Tab面板组件
 */
const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

/**
 * 个人资料对话框
 */
export const ProfileDialog = ({ open, onClose }: ProfileDialogProps) => {
  const [currentTab, setCurrentTab] = useState(0);
  const { user } = useAuthStore();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  if (!user) {
    return null;
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          minHeight: fullScreen ? '100%' : 600,
        },
      }}
    >
      {/* 标题栏 */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        个人资料
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      {/* Tabs导航 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="profile tabs"
          variant={fullScreen ? 'fullWidth' : 'standard'}
        >
          <Tab label="基本信息" id="profile-tab-0" />
          <Tab label="安全设置" id="profile-tab-1" />
        </Tabs>
      </Box>

      {/* 对话框内容 */}
      <DialogContent>
        <TabPanel value={currentTab} index={0}>
          <BasicInfoTab user={user} />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <SecurityTab />
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};
