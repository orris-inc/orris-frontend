import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Slider,
  Typography,
} from '@mui/material';
import Cropper, { Area } from 'react-easy-crop';
import { LoadingButton } from '@mui/lab';

interface AvatarCropDialogProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onConfirm: (croppedImage: Blob) => Promise<void>;
}

/**
 * 创建裁剪后的图片
 */
const createCroppedImage = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> => {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法创建canvas上下文');
  }

  // 设置canvas尺寸
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // 绘制裁剪后的图片
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // 转换为Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas转换失败'));
      }
    }, 'image/jpeg');
  });
};

/**
 * 加载图片
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * 头像裁剪对话框
 */
export const AvatarCropDialog = ({
  open,
  imageSrc,
  onClose,
  onConfirm,
}: AvatarCropDialogProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const croppedBlob = await createCroppedImage(imageSrc, croppedAreaPixels);
      await onConfirm(croppedBlob);
      onClose();
    } catch (error) {
      console.error('裁剪失败:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>裁剪头像</DialogTitle>
      <DialogContent>
        <Box sx={{ position: 'relative', width: '100%', height: 400, mb: 2 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </Box>

        <Box sx={{ px: 2 }}>
          <Typography variant="body2" gutterBottom>
            缩放
          </Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(_e, value) => setZoom(value as number)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isUploading}>
          取消
        </Button>
        <LoadingButton
          onClick={handleConfirm}
          variant="contained"
          loading={isUploading}
        >
          确认
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
