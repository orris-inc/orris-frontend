/**
 * Login Page - Minimalist Style "Breathing Space"
 * Design philosophy: 75% whitespace + Refined typography + Warm neutral tones
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { Loader2, CircleAlert } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { isAccountNotActiveError } from '@/shared/utils/error-messages';

// Zod login form validation
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少需要8个字符'),
  rememberMe: z.boolean().catch(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPageMinimal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { login, loginWithOAuth, isLoading, error } = useAuth();
  const { showSuccess, showError } = useNotificationStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  // Get message from location.state
  const state = location.state as { message?: string } | null;
  const successMessage = state?.message;

  // Redirect based on user role if already logged in
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
    <div className="minimal-login">
      {/* Background Texture */}
      <div className="fixed inset-0 bg-[#F7F5F2]">
        <div className="absolute inset-0 opacity-[0.02] bg-noise" />
      </div>

      {/* Main Content Area */}
      <div className="relative min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          {/* Breathing Line */}
          <div className="flex justify-center mb-12">
            <div className="breathing-line" />
          </div>

          {/* Logo */}
          <div className="text-center mb-12 fade-in" style={{ animationDelay: '0s' }}>
            <h1 className="text-[60px] font-serif tracking-[0.15em] text-[#2B2926] mb-4">
              Orris
            </h1>
          </div>

          {/* Title */}
          <div className="text-center mb-16 fade-in" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-[32px] font-light text-[#2B2926] mb-2 font-serif">
              欢迎回来
            </h2>
            <p className="text-[14px] text-[#7A7672]">
              登录您的账号继续使用
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-8 fade-in" style={{ animationDelay: '0.5s' }}>
              <p className="text-[13px] text-[#6B8E6F] text-center">
                {successMessage}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-8 fade-in error-shake">
              <div className="flex items-start gap-2">
                <CircleAlert className="w-4 h-4 text-[#D4635F] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[13px] text-[#D4635F] leading-relaxed">
                    {error}
                  </p>
                  {showResendVerification && (
                    <button
                      onClick={handleResendVerification}
                      className="text-[13px] text-[#6B8E6F] underline mt-2 hover:text-[#5A7A5E] transition-colors duration-300"
                    >
                      前往验证
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            {/* Email Input */}
            <div className="floating-input-group fade-in" style={{ animationDelay: '0.7s' }}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="floating-input"
                placeholder=" "
                {...register('email')}
              />
              <label htmlFor="email" className="floating-label">
                邮箱地址
              </label>
              <div className="input-line" />
              {errors.email && (
                <p className="text-[12px] text-[#D4635F] mt-2 error-shake">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="floating-input-group fade-in" style={{ animationDelay: '0.9s' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="floating-input pr-16"
                placeholder=" "
                {...register('password')}
              />
              <label htmlFor="password" className="floating-label">
                密码
              </label>
              <div className="input-line" />
              <button
                type="button"
                className="absolute right-0 top-4 text-[13px] text-[#7A7672] hover:text-[#2B2926] transition-colors duration-300"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="切换密码显示"
                tabIndex={-1}
              >
                {showPassword ? '隐藏' : '显示'}
              </button>
              {errors.password && (
                <p className="text-[12px] text-[#D4635F] mt-2 error-shake">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-[13px] fade-in" style={{ animationDelay: '1.1s' }}>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setValue('rememberMe', e.target.checked)}
                  className="w-4 h-4 rounded-sm border border-[#2B2926]/20 text-[#6B8E6F] focus:ring-0 focus:ring-offset-0 transition-all duration-300"
                />
                <span className="text-[#7A7672] group-hover:text-[#2B2926] transition-colors duration-300">
                  记住我
                </span>
              </label>
              <RouterLink
                to="/forgot-password"
                className="text-[#7A7672] hover:text-[#2B2926] transition-colors duration-300 underline-hover"
              >
                忘记密码？
              </RouterLink>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#6B8E6F] text-white text-[15px] tracking-wider font-medium rounded-sm hover:bg-[#5A7A5E] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400 hover:shadow-minimal hover:-translate-y-0.5 fade-in"
              style={{ animationDelay: '1.3s' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  登录中
                </span>
              ) : (
                '登  录'
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-12 fade-in" style={{ animationDelay: '1.5s' }}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-[#2B2926]/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#F7F5F2] px-4 text-[13px] text-[#7A7672]">
                或
              </span>
            </div>
          </div>

          {/* OAuth Login */}
          <div className="space-y-4 text-center fade-in" style={{ animationDelay: '1.7s' }}>
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
              className="text-[14px] text-[#7A7672] hover:text-[#2B2926] transition-colors duration-300 underline-hover"
            >
              通过 Google 继续
            </button>
            <span className="block text-[#7A7672]/40">·</span>
            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              disabled={isLoading}
              className="text-[14px] text-[#7A7672] hover:text-[#2B2926] transition-colors duration-300 underline-hover"
            >
              通过 GitHub 继续
            </button>
          </div>

          {/* Register Link */}
          <div className="mt-16 text-center text-[13px] text-[#7A7672] fade-in" style={{ animationDelay: '1.9s' }}>
            还没有账号？{' '}
            <RouterLink
              to="/register"
              className="text-[#2B2926] hover:text-[#6B8E6F] transition-colors duration-300 underline-hover font-medium"
            >
              立即注册
            </RouterLink>
          </div>
        </div>
      </div>

      {/* Version */}
      <div className="fixed bottom-6 right-6 text-[10px] text-[#7A7672]/30 font-mono tracking-wider">
        v1.2.0
      </div>

      {/* Inline Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;600&family=Manrope:wght@300;400;500;600&display=swap');

        .minimal-login {
          font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .minimal-login h1,
        .minimal-login h2 {
          font-family: 'Crimson Pro', serif;
        }

        /* Noise Texture */}
        .bg-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        /* Breathing Line Animation */}
        .breathing-line {
          width: 40px;
          height: 1px;
          background: #2B2926;
          opacity: 0.3;
          animation: breathe 4s ease-in-out infinite;
        }

        @keyframes breathe {
          0%, 100% {
            width: 40px;
            opacity: 0.3;
          }
          50% {
            width: 80px;
            opacity: 0.6;
          }
        }

        /* Floating Input */}
        .floating-input-group {
          position: relative;
          margin-bottom: 0;
        }

        .floating-input {
          width: 100%;
          padding: 1rem 0 0.5rem;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(43, 41, 38, 0.12);
          color: #2B2926;
          font-size: 16px;
          outline: none;
          transition: border-color 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .floating-input:focus {
          border-bottom-color: transparent;
        }

        .floating-label {
          position: absolute;
          left: 0;
          top: 1rem;
          color: #7A7672;
          font-size: 16px;
          pointer-events: none;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .floating-input:focus ~ .floating-label,
        .floating-input:not(:placeholder-shown) ~ .floating-label {
          top: -0.5rem;
          font-size: 12px;
          color: #6B8E6F;
        }

        .input-line {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: #6B8E6F;
          transform: translateX(-50%);
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .floating-input:focus ~ .input-line {
          width: 100%;
        }

        /* Underline Hover Effect */}
        .underline-hover {
          position: relative;
        }

        .underline-hover::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: currentColor;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .underline-hover:hover::after {
          width: 100%;
        }

        /* Button Shadow */}
        .shadow-minimal {
          box-shadow: 0 4px 12px rgba(107, 142, 111, 0.15);
        }

        /* Fade In Animation */}
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }

        /* Error Shake Animation */}
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }

        .error-shake {
          animation: shake 0.3s ease-in-out;
        }

        /* Responsive */}
        @media (max-width: 768px) {
          .minimal-login h1 {
            font-size: 48px;
          }

          .minimal-login h2 {
            font-size: 28px;
          }

          .breathing-line {
            display: none;
          }
        }

        /* Custom Checkbox Style */}
        input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
        }

        input[type="checkbox"]:checked {
          background-color: #6B8E6F;
          border-color: #6B8E6F;
          background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
        }
      `}</style>
    </div>
  );
};
