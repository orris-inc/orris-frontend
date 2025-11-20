import { useState, useRef } from 'react';
import { Camera, Info } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const getAvatarFallback = () => {
    if (name) {
      return name[0]?.toUpperCase();
    }
    return '?';
  };

  return (
    <div className="text-center">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />

      <Avatar
        className="mx-auto mb-4 size-32 cursor-pointer transition-opacity hover:opacity-80"
        onClick={() => inputRef.current?.click()}
      >
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className="text-5xl">{getAvatarFallback()}</AvatarFallback>
      </Avatar>

      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={true}
        className="mb-2"
      >
        <Camera />
        更换头像（暂不可用）
      </Button>

      <p className="mb-4 text-xs text-muted-foreground">
        支持JPG、PNG、WebP格式，最大2MB
      </p>

      {/* 后端API开发中提示 */}
      <Alert>
        <Info className="size-4" />
        <AlertDescription>
          头像上传功能正在开发中，后端API尚未就绪。请耐心等待更新。
        </AlertDescription>
      </Alert>

      {/* 裁剪对话框 */}
      <AvatarCropDialog
        open={cropDialogOpen}
        imageSrc={imageSrc}
        onClose={() => setCropDialogOpen(false)}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
};
