import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  /**
   * Update profile
   */
  const updateProfile = useCallback(
    async (data: UpdateProfileRequest) => {
      if (!user) {
        showError(t('messages.profileNoUser'));
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

        showSuccess(t('messages.profileUpdateSuccess'));
      } catch (error) {
        const errorMsg = extractErrorMessage(error);
        showError(errorMsg);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [user, setUser, showSuccess, showError, t]
  );

  /**
   * Change password
   */
  const changePassword = useCallback(
    async (data: ChangePasswordRequest) => {
      setIsLoading(true);
      try {
        await apiChangePassword(data);
        showSuccess(t('messages.passwordChangeSuccess'));
      } catch (error) {
        const errorMsg = extractErrorMessage(error);
        showError(errorMsg);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [showSuccess, showError, t]
  );

  /**
   * Upload avatar
   */
  const uploadAvatar = useCallback(
    async (_file: File) => {
      void _file; // Will be used when avatar upload is implemented
      if (!user) {
        showError(t('messages.profileNoUser'));
        return;
      }

      setIsLoading(true);
      try {
        // TODO: Avatar upload not implemented yet
        // const { avatar_url } = await uploadAvatarApi(file);
        // setUser({ ...user, avatar: avatar_url });
        showSuccess(t('messages.avatarUpdateSuccess'));
        return '';
      } catch (error) {
        const errorMsg = extractErrorMessage(error);
        showError(errorMsg);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [user, showSuccess, showError, t]
  );

  return {
    user,
    isLoading,
    updateProfile,
    changePassword,
    uploadAvatar,
  };
};
