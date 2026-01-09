import { useState, useRef } from 'react';
import { Camera, Info } from 'lucide-react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { AvatarCropDialog } from './AvatarCropDialog';
import { useProfile } from '../hooks/useProfile';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { alertDescriptionStyles } from '@/lib/ui-styles';

interface AvatarUploadProps {
  avatar?: string;
  name?: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Avatar upload component with iOS 26 Liquid Glass style
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
    <div className="flex flex-col items-center text-center">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Avatar - responsive size with glass ring effect */}
      <AvatarPrimitive.Root
        className="mx-auto mb-4 size-24 sm:size-32 cursor-pointer transition-all duration-300 hover:opacity-80 hover:scale-105 relative inline-flex shrink-0 overflow-hidden rounded-full ring-2 ring-border/30 ring-offset-2 ring-offset-background"
        onClick={() => inputRef.current?.click()}
      >
        <AvatarPrimitive.Image
          src={avatar}
          alt={name}
          className="aspect-square h-full w-full"
        />
        <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-muted text-4xl sm:text-5xl">
          {getAvatarFallback()}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>

      {/* Upload button - iOS 26 Liquid Glass interactive style */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={true}
        className="glass-interactive inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-border/50 bg-background hover:bg-accent hover:text-accent-foreground h-11 sm:h-10 px-4 py-2 mb-2 gap-2 touch-target"
      >
        <Camera className="h-4 w-4" />
        更换头像（暂不可用）
      </button>

      <p className="mb-4 text-xs text-muted-foreground">
        支持JPG、PNG、WebP格式，最大2MB
      </p>

      {/* Backend API in development notice - iOS 26 Liquid Glass style */}
      <div className="glass relative w-full rounded-xl p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground">
        <Info className="size-4" />
        <div className={`${alertDescriptionStyles} text-xs sm:text-sm`}>
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
