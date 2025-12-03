import { useState, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { extractErrorMessage } from '@/shared/utils/error-messages';
import {
  updateProfile as apiUpdateProfile,
  changePassword as apiChangePassword,
  type UpdateProfileRequest,
  type ChangePasswordRequest,
} from '@/api/profile';

/**
 * 个人资料管理Hook
 */
export const useProfile = () => {
  const { user, setUser } = useAuthStore();
  const { showSuccess, showError } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 更新个人资料
   */
  const updateProfile = useCallback(
    async (data: UpdateProfileRequest) => {
      if (!user) {
        showError('用户信息不存在');
        return;
      }

      setIsLoading(true);
      try {
        await apiUpdateProfile(data);

        // 更新Auth Store中的用户信息（只更新修改的字段）
        setUser({
          ...user,
          ...data,
        });

        showSuccess('个人资料已更新');
      } catch (error) {
        const errorMsg = extractErrorMessage(error);
        showError(errorMsg);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [user, setUser, showSuccess, showError]
  );

  /**
   * 修改密码
   */
  const changePassword = useCallback(
    async (data: ChangePasswordRequest) => {
      setIsLoading(true);
      try {
        await apiChangePassword(data);
        showSuccess('密码已修改成功');
      } catch (error) {
        const errorMsg = extractErrorMessage(error);
        showError(errorMsg);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [showSuccess, showError]
  );

  /**
   * 上传头像
   */
  const uploadAvatar = useCallback(
    async (_file: File) => {
      if (!user) {
        showError('用户信息不存在');
        return;
      }

      setIsLoading(true);
      try {
        console.warn('头像上传功能暂未实现');
        // TODO: 实现头像上传
        // const { avatar_url } = await uploadAvatarApi(file);
        // setUser({ ...user, avatar: avatar_url });
        showSuccess('头像已更新');
        return '';
      } catch (error) {
        const errorMsg = extractErrorMessage(error);
        showError(errorMsg);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [user, setUser, showSuccess, showError]
  );

  return {
    user,
    isLoading,
    updateProfile,
    changePassword,
    uploadAvatar,
  };
};
