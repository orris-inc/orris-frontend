/**
 * 登录页面 - Apple 简约风格
 * 设计理念：极致简约、优雅精致、专注内容
 * 配色：白色背景 + 黑色文字 + 系统蓝
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { isAccountNotActiveError } from '@/shared/utils/error-messages';

// Zod 登录表单验证
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少需要8个字符'),
  rememberMe: z.boolean().catch(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPageApple = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { login, loginWithOAuth, isLoading, error } = useAuth();
  const { showSuccess, showError } = useNotificationStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  // 从 location.state 获取提示消息
  const state = location.state as { message?: string } | null;
  const successMessage = state?.message;

  // 已登录则根据用户角色跳转
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const rememberMe = watch('rememberMe');

  const onSubmit = async (data: LoginFormData) => {
    setShowResendVerification(false);
    setUserEmail(data.email);

    try {
      await login(data);
      showSuccess('登录成功！');
    } catch (err) {
      if (isAccountNotActiveError(err)) {
        setShowResendVerification(true);
      }
      const errorMessage = err instanceof Error ? err.message : '登录失败，请重试';
      showError(errorMessage);
    }
  };

  const handleResendVerification = () => {
    navigate('/verification-pending', {
      state: { email: userEmail },
    });
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      await loginWithOAuth(provider);
      showSuccess('登录成功！');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth登录失败';
      showError(errorMessage);
    }
  };

  return (
    <div className="apple-login">
      {/* 背景 */}
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6">
        <div className="w-full max-w-[440px]">
          {/* Logo 区域 */}
          <div className="text-center mb-10 fade-in-down">
            <h1 className="text-[32px] font-semibold text-[#1d1d1f] mb-2 tracking-tight">
              登录 Orris
            </h1>
            <p className="text-[14px] text-[#86868b] font-normal">
              使用您的 Orris ID 继续
            </p>
          </div>

          {/* 登录卡片 */}
          <div className="bg-white rounded-xl shadow-sm border border-[#d2d2d7] overflow-hidden fade-in-up">
            {/* 成功消息 */}
            {successMessage && (
              <div className="px-6 pt-6">
                <div className="flex items-start gap-3 p-4 bg-[#d1f4e0] rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-[#00914d] flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-[#00914d] leading-relaxed">{successMessage}</p>
                </div>
              </div>
            )}

            {/* 错误消息 */}
            {error && (
              <div className="px-6 pt-6">
                <div className="flex items-start gap-3 p-4 bg-[#fff0f0] rounded-lg animate-shake">
                  <AlertCircle className="w-5 h-5 text-[#dd2d44] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[13px] text-[#dd2d44] leading-relaxed">{error}</p>
                    {showResendVerification && (
                      <button
                        onClick={handleResendVerification}
                        className="text-[13px] text-[#0071e3] mt-2 hover:underline"
                      >
                        前往验证
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 登录表单 */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="space-y-4">
                {/* 邮箱输入 */}
                <div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="邮箱地址"
                    className={`apple-input ${errors.email ? 'apple-input-error' : ''}`}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-[11px] text-[#dd2d44] mt-2 animate-shake">{errors.email.message}</p>
                  )}
                </div>

                {/* 密码输入 */}
                <div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="密码"
                      className={`apple-input ${errors.password ? 'apple-input-error' : ''}`}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[#0071e3] hover:text-[#0077ed] font-normal"
                      tabIndex={-1}
                    >
                      {showPassword ? '隐藏' : '显示'}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-[#dd2d44] mt-2 animate-shake">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* 记住我 */}
              <label className="flex items-center gap-2 mt-5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setValue('rememberMe', e.target.checked)}
                  className="w-[17px] h-[17px] rounded-[4px] border-[1.5px] border-[#d2d2d7] checked:bg-[#0071e3] checked:border-[#0071e3] transition-colors cursor-pointer"
                />
                <span className="text-[14px] text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors">
                  保持登录状态
                </span>
              </label>

              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="apple-button w-full mt-6"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    登录中
                  </span>
                ) : (
                  '登录'
                )}
              </button>

              {/* 忘记密码 */}
              <div className="text-center mt-4">
                <RouterLink
                  to="/forgot-password"
                  className="text-[14px] text-[#0071e3] hover:text-[#0077ed] hover:underline"
                >
                  忘记 Orris ID 或密码？
                </RouterLink>
              </div>
            </form>

            {/* 分隔线 */}
            <div className="relative px-6">
              <div className="h-px bg-[#d2d2d7]" />
            </div>

            {/* OAuth 登录 */}
            <div className="p-6 space-y-3">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
                className="apple-oauth-button"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>使用 Google 登录</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthLogin('github')}
                disabled={isLoading}
                className="apple-oauth-button"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                <span>使用 GitHub 登录</span>
              </button>
            </div>
          </div>

          {/* 注册链接 */}
          <div className="text-center mt-5 fade-in-up" style={{ animationDelay: '0.2s' }}>
            <span className="text-[14px] text-[#86868b]">还没有 Orris ID？</span>{' '}
            <RouterLink
              to="/register"
              className="text-[14px] text-[#0071e3] hover:text-[#0077ed] hover:underline"
            >
              立即创建
            </RouterLink>
          </div>

          {/* 底部信息 */}
          <div className="text-center mt-8">
            <p className="text-[12px] text-[#86868b]">
              此网站受 reCAPTCHA 保护，并适用
              <br />
              Google{' '}
              <a href="#" className="text-[#0071e3] hover:underline">隐私政策</a>
              {' '}和{' '}
              <a href="#" className="text-[#0071e3] hover:underline">服务条款</a>
            </p>
          </div>
        </div>
      </div>

      {/* 内联样式 - Apple 风格 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .apple-login {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Apple 输入框 */
        .apple-input {
          width: 100%;
          height: 52px;
          padding: 0 16px;
          background: #fff;
          border: 1px solid #d2d2d7;
          border-radius: 12px;
          font-size: 17px;
          color: #1d1d1f;
          outline: none;
          transition: all 0.2s ease;
        }

        .apple-input::placeholder {
          color: #86868b;
        }

        .apple-input:focus {
          border-color: #0071e3;
          box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.1);
        }

        .apple-input-error {
          border-color: #dd2d44;
        }

        .apple-input-error:focus {
          border-color: #dd2d44;
          box-shadow: 0 0 0 4px rgba(221, 45, 68, 0.1);
        }

        /* Apple 按钮 */
        .apple-button {
          height: 52px;
          padding: 0 24px;
          background: #0071e3;
          border: none;
          border-radius: 12px;
          font-size: 17px;
          font-weight: 500;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .apple-button:hover:not(:disabled) {
          background: #0077ed;
        }

        .apple-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .apple-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Apple OAuth 按钮 */
        .apple-oauth-button {
          width: 100%;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #fff;
          border: 1px solid #d2d2d7;
          border-radius: 12px;
          font-size: 17px;
          font-weight: 500;
          color: #1d1d1f;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .apple-oauth-button:hover:not(:disabled) {
          background: #f5f5f7;
          border-color: #b8b8bd;
        }

        .apple-oauth-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .apple-oauth-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* 动画 */
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .fade-in-down {
          animation: fade-in-down 0.6s ease-out;
        }

        .fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        /* 自定义复选框 */
        input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
        }

        input[type="checkbox"]:checked {
          background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
          background-size: 100% 100%;
          background-position: center;
          background-repeat: no-repeat;
        }

        /* 响应式 */
        @media (max-width: 640px) {
          .apple-login h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
};
