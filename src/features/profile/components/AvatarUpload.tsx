import { useState, useRef } from 'react';
import { Camera, Info } from 'lucide-react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { AvatarCropDialog } from './AvatarCropDialog';
import { useProfile } from '../hooks/useProfile';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { getButtonClass, getAlertClass, alertDescriptionStyles } from '@/lib/ui-styles';

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

      <AvatarPrimitive.Root
        className="mx-auto mb-4 size-32 cursor-pointer transition-opacity hover:opacity-80 relative inline-flex shrink-0 overflow-hidden rounded-full"
        onClick={() => inputRef.current?.click()}
      >
        <AvatarPrimitive.Image
          src={avatar}
          alt={name}
          className="aspect-square h-full w-full"
        />
        <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-muted text-5xl">
          {getAvatarFallback()}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>

      <button
        onClick={() => inputRef.current?.click()}
        disabled={true}
        className={getButtonClass('outline', 'default', 'mb-2 gap-2')}
      >
        <Camera className="h-4 w-4" />
        更换头像（暂不可用）
      </button>

      <p className="mb-4 text-xs text-muted-foreground">
        支持JPG、PNG、WebP格式，最大2MB
      </p>

      {/* 后端API开发中提示 */}
      <div className={getAlertClass('default')}>
        <Info className="size-4" />
        <div className={alertDescriptionStyles}>
          头像上传功能正在开发中，后端API尚未就绪。请耐心等待更新。
        </div>
      </div>

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
