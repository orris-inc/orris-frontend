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
 * Avatar upload component
 */
export const AvatarUpload = ({ avatar, name }: AvatarUploadProps) => {
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar } = useProfile();
  const { showError } = useNotificationStore();

  /**
   * File selection handler
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear input value to allow selecting the same file again
    event.target.value = '';

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      showError('图片大小不能超过2MB');
      return;
    }

    // File type validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      showError('只支持JPG、PNG和WebP格式');
      return;
    }

    // Read file and show crop dialog
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Confirm upload of cropped image
   */
  const handleCropConfirm = async (croppedBlob: Blob) => {
    // Convert Blob to File
    const file = new File([croppedBlob], 'avatar.jpg', {
      type: 'image/jpeg',
    });

    await uploadAvatar(file);
  };

  /**
   * Get avatar fallback content
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

      {/* Backend API in development notice */}
      <div className={getAlertClass('default')}>
        <Info className="size-4" />
        <div className={alertDescriptionStyles}>
          头像上传功能正在开发中，后端API尚未就绪。请耐心等待更新。
        </div>
      </div>

      {/* Crop dialog */}
      <AvatarCropDialog
        open={cropDialogOpen}
        imageSrc={imageSrc}
        onClose={() => setCropDialogOpen(false)}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
};
