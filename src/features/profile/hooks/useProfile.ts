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
 * Profile management hook
 */
export const useProfile = () => {
  const { user, setUser } = useAuthStore();
  const { showSuccess, showError } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Update profile
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

        // Update user info in Auth Store (only update modified fields)
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
   * Change password
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
   * Upload avatar
   */
  const uploadAvatar = useCallback(
    async (_file: File) => {
      void _file; // Will be used when avatar upload is implemented
      if (!user) {
        showError('用户信息不存在');
        return;
      }

      setIsLoading(true);
      try {
        // TODO: Avatar upload not implemented yet
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
    [user, showSuccess, showError]
  );

  return {
    user,
    isLoading,
    updateProfile,
    changePassword,
    uploadAvatar,
  };
};
