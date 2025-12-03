/**
 * 创建用户对话框组件
 */

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as LabelPrimitive from '@radix-ui/react-label';
import { X } from 'lucide-react';
import { getButtonClass, inputStyles, labelStyles } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';
import type { CreateUserRequest } from '../types/users.types';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest) => void;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; name?: string; password?: string }>({});

  const handleClose = () => {
    setEmail('');
    setName('');
    setPassword('');
    setErrors({});
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  const validate = () => {
    const newErrors: { email?: string; name?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '邮箱格式不正确';
    }

    if (!name.trim()) {
      newErrors.name = '姓名不能为空';
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      newErrors.name = '姓名长度必须在2-100个字符之间';
    }

    if (!password.trim()) {
      newErrors.password = '密码不能为空';
    } else if (password.trim().length < 8) {
      newErrors.password = '密码长度至少需要8个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({ email: email.trim(), name: name.trim(), password: password.trim() });
      handleClose();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
              新增用户
            </Dialog.Title>
            <Dialog.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <LabelPrimitive.Root htmlFor="email" className={labelStyles}>
                邮箱
              </LabelPrimitive.Root>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@domain.com"
                className={cn(inputStyles, errors.email && "border-destructive")}
                autoFocus
              />
              {errors.email && (
                <span className="text-sm text-destructive">{errors.email}</span>
              )}
            </div>
            <div className="grid gap-2">
              <LabelPrimitive.Root htmlFor="name" className={labelStyles}>
                姓名
              </LabelPrimitive.Root>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="用户姓名"
                className={cn(inputStyles, errors.name && "border-destructive")}
              />
              {errors.name ? (
                <span className="text-sm text-destructive">{errors.name}</span>
              ) : (
                <span className="text-sm text-muted-foreground">长度2-100个字符</span>
              )}
            </div>
            <div className="grid gap-2">
              <LabelPrimitive.Root htmlFor="password" className={labelStyles}>
                密码
              </LabelPrimitive.Root>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="设置初始密码"
                className={cn(inputStyles, errors.password && "border-destructive")}
              />
              {errors.password ? (
                <span className="text-sm text-destructive">{errors.password}</span>
              ) : (
                <span className="text-sm text-muted-foreground">至少8个字符</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleClose}
              className={getButtonClass('outline', 'default')}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!email.trim() || !name.trim() || !password.trim()}
              className={getButtonClass('default', 'default')}
            >
              创建
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
