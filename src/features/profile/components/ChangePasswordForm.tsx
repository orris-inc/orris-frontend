import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Smartphone, Loader2, AlertTriangle } from 'lucide-react';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { inputStyles, labelStyles, getAlertClass } from '@/lib/ui-styles';
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from '../types/profile.types';

/**
 * 计算密码强度
 */
const calculatePasswordStrength = (password: string): number => {
  let strength = 0;

  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/\d/.test(password)) strength += 25;

  return strength;
};

/**
 * 获取密码强度颜色类名
 */
const getStrengthColor = (strength: number): string => {
  if (strength < 25) return 'bg-red-500';
  if (strength < 50) return 'bg-yellow-500';
  if (strength < 75) return 'bg-blue-500';
  return 'bg-green-500';
};

/**
 * 获取密码强度文本
 */
const getStrengthText = (strength: number): string => {
  if (strength < 25) return '弱';
  if (strength < 50) return '中';
  if (strength < 75) return '良';
  return '强';
};

/**
 * 修改密码表单
 */
export const ChangePasswordForm = () => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordStrength, setNewPasswordStrength] = useState(0);

  const { changePassword, isLoading } = useProfile();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      logoutAllDevices: false,
    },
  });

  const newPassword = watch('newPassword');

  // 监听新密码变化，更新强度指示器
  useEffect(() => {
    if (newPassword) {
      setNewPasswordStrength(calculatePasswordStrength(newPassword));
    } else {
      setNewPasswordStrength(0);
    }
  }, [newPassword]);

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePassword(data);
      reset(); // 清空表单
    } catch (error) {
      // 错误已在useProfile中处理
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-6 py-2"
    >
      {/* 当前密码 */}
      <div className="grid gap-2">
        <LabelPrimitive.Root htmlFor="oldPassword" className={labelStyles}>
          当前密码
        </LabelPrimitive.Root>
        <div className="relative">
          <input
            id="oldPassword"
            type={showOldPassword ? 'text' : 'password'}
            className={inputStyles}
            {...register('oldPassword')}
            aria-invalid={!!errors.oldPassword}
          />
          <button
            type="button"
            onClick={() => setShowOldPassword(!showOldPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showOldPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.oldPassword && (
          <p className="text-sm text-destructive">{errors.oldPassword.message}</p>
        )}
      </div>

      {/* 新密码 */}
      <div className="grid gap-2">
        <LabelPrimitive.Root htmlFor="newPassword" className={labelStyles}>
          新密码
        </LabelPrimitive.Root>
        <div className="relative">
          <input
            id="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            className={inputStyles}
            {...register('newPassword')}
            aria-invalid={!!errors.newPassword}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-sm text-destructive">{errors.newPassword.message}</p>
        )}

        {/* 密码强度指示器 */}
        {newPassword && (
          <div className="space-y-1">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full transition-all duration-300 ${getStrengthColor(newPasswordStrength)}`}
                style={{ width: `${newPasswordStrength}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              密码强度：{getStrengthText(newPasswordStrength)}
            </p>
          </div>
        )}
      </div>

      {/* 确认新密码 */}
      <div className="grid gap-2">
        <LabelPrimitive.Root htmlFor="confirmPassword" className={labelStyles}>
          确认新密码
        </LabelPrimitive.Root>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            className={inputStyles}
            {...register('confirmPassword')}
            aria-invalid={!!errors.confirmPassword}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* 登出所有设备选项 */}
      <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
        <CheckboxPrimitive.Root
          id="logoutAllDevices"
          className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          {...register('logoutAllDevices')}
          onCheckedChange={(checked) => {
            const event = {
              target: {
                name: 'logoutAllDevices',
                value: checked,
              },
            };
            register('logoutAllDevices').onChange(event as any);
          }}
        >
          <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
            <Check className="h-4 w-4" />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="logoutAllDevices"
            className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            <Smartphone className="h-4 w-4" />
            登出所有设备
          </label>
          <p className="text-sm text-muted-foreground">
            修改密码后，强制其他设备重新登录
          </p>
        </div>
      </div>

      {/* 安全提示 */}
      <div className={getAlertClass('destructive')}>
        <AlertTriangle className="h-4 w-4" />
        <div>
          <p className="text-sm font-medium">安全提示</p>
          <p className="text-sm">
            修改密码后，如果选择"登出所有设备"，您需要在所有设备上重新登录
          </p>
        </div>
      </div>

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        修改密码
      </button>
    </form>
  );
};
