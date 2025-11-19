import { useState, useRef } from 'react';
import { Box, Avatar, Button, Typography, Alert } from '@mui/material';
import { PhotoCamera, InfoOutlined } from '@mui/icons-material';
import { AvatarCropDialog } from './AvatarCropDialog';
import { useProfile } from '../hooks/useProfile';
import { useNotificationStore } from '@/shared/stores/notification-store';

interface AvatarUploadProps {
  avatar?: string;
  name?: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * 头像上传组件
 */
export const AvatarUpload = ({ avatar, name }: AvatarUploadProps) => {
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar } = useProfile();
  const { showError } = useNotificationStore();

  /**
   * 文件选择处理
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 清空input值，允许重复选择同一文件
    event.target.value = '';

    // 文件大小验证
    if (file.size > MAX_FILE_SIZE) {
      showError('图片大小不能超过2MB');
      return;
    }

    // 文件类型验证
    if (!ALLOWED_TYPES.includes(file.type)) {
      showError('只支持JPG、PNG和WebP格式');
      return;
    }

    // 读取文件并显示裁剪对话框
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  /**
   * 确认上传裁剪后的图片
   */
  const handleCropConfirm = async (croppedBlob: Blob) => {
    // 将Blob转换为File
    const file = new File([croppedBlob], 'avatar.jpg', {
      type: 'image/jpeg',
    });

    await uploadAvatar(file);
  };

  /**
   * 获取头像显示内容
   */
  const getAvatarContent = () => {
    if (avatar) {
      return undefined; // 使用src显示图片
    }
    if (name) {
      return name[0]?.toUpperCase();
    }
    return '?';
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Avatar
        src={avatar}
        sx={{
          width: 120,
          height: 120,
          mx: 'auto',
          mb: 2,
          cursor: 'pointer',
          fontSize: 48,
          '&:hover': {
            opacity: 0.8,
          },
        }}
        onClick={() => inputRef.current?.click()}
      >
        {getAvatarContent()}
      </Avatar>

      <Button
        variant="outlined"
        startIcon={<PhotoCamera />}
        onClick={() => inputRef.current?.click()}
        disabled={true}
        sx={{ mb: 1 }}
      >
        更换头像（暂不可用）
      </Button>

      <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
        支持JPG、PNG、WebP格式，最大2MB
      </Typography>

      {/* 后端API开发中提示 */}
      <Alert severity="info" icon={<InfoOutlined />} sx={{ textAlign: 'left' }}>
        头像上传功能正在开发中，后端API尚未就绪。请耐心等待更新。
      </Alert>

      {/* 裁剪对话框 */}
      <AvatarCropDialog
        open={cropDialogOpen}
        imageSrc={imageSrc}
        onClose={() => setCropDialogOpen(false)}
        onConfirm={handleCropConfirm}
      />
    </Box>
  );
};
