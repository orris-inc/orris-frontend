/**
 * Login Page - Neo Art Deco Design
 * Design style: Art Deco × Modern refinement
 * Colors: Deep ink green + Golden amber + Ivory white
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Chrome, Github, Loader2, CircleAlert, Check } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { isAccountNotActiveError } from '@/shared/utils/error-messages';
import { cn } from '@/lib/utils';

// Zod login form validation
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少需要8个字符'),
  rememberMe: z.boolean().catch(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Art Deco decorative pattern component
const DecoPattern1 = () => (
  <svg className="absolute top-8 left-8 w-32 h-32 opacity-20 deco-pattern" viewBox="0 0 100 100">
    <path
      d="M50 10 L90 50 L50 90 L10 50 Z M50 30 L70 50 L50 70 L30 50 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
      className="text-amber-400"
    />
    <circle cx="50" cy="50" r="5" fill="currentColor" className="text-amber-400" />
  </svg>
);

const DecoPattern2 = () => (
  <svg className="absolute bottom-12 right-12 w-40 h-40 opacity-15 deco-pattern" viewBox="0 0 100 100">
    <g className="text-amber-400" fill="none" stroke="currentColor" strokeWidth="0.5">
      <path d="M50 20 L80 50 L50 80 L20 50 Z" />
      <path d="M50 10 L90 50 L50 90 L10 50 Z" />
      <circle cx="50" cy="50" r="15" />
    </g>
  </svg>
);

const DecoPattern3 = () => (
  <svg className="absolute top-1/3 right-1/4 w-24 h-24 opacity-10 deco-pattern" viewBox="0 0 100 100">
    <path
      d="M50 10 L60 30 L80 30 L65 45 L70 65 L50 52 L30 65 L35 45 L20 30 L40 30 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
      className="text-amber-400"
    />
  </svg>
);

const DecoLines = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Top decorative line */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
    {/* Bottom decorative line */}
    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
  </div>
);

export const LoginPageNew = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { login, loginWithOAuth, isLoading, error } = useAuth();
  const { showSuccess, showError } = useNotificationStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  // Parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
    <div className="min-h-screen relative overflow-hidden art-deco-login">
      {/* 背景层 */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a1612] via-[#122019] to-[#1a2e27]">
        {/* 噪点纹理 */}
        <div className="absolute inset-0 opacity-30 bg-noise" />

        {/* 径向光晕 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* 装饰图案层 - 视差效果 */}
      <div
        className="fixed inset-0 transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0)`,
        }}
      >
        <DecoPattern1 />
        <DecoPattern2 />
        <DecoPattern3 />
      </div>

      <DecoLines />

      {/* 主内容区 */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo 和品牌区 */}
          <div className="text-center mb-12 fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-6xl font-serif text-amber-400 tracking-[0.2em] mb-4 logo-glow">
              ORRIS
            </h1>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mb-6" />
            <p className="text-emerald-100/60 text-sm tracking-wider">优雅登录体验</p>
          </div>

          {/* 表单容器 - 玻璃态效果 */}
          <div className="glass-card p-8 rounded-lg relative overflow-hidden fade-in-up" style={{ animationDelay: '0.4s' }}>
            {/* 装饰边角 */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-500/30" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-500/30" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-500/30" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-500/30" />

            {/* 标题 */}
            <div className="mb-8">
              <h2 className="text-2xl font-serif text-emerald-50 mb-2">欢迎回来</h2>
              <p className="text-emerald-100/50 text-sm">登录您的账号继续使用</p>
            </div>

            {/* 成功消息 */}
            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded backdrop-blur-sm alert-slide-in">
                <p className="text-emerald-200 text-sm">{successMessage}</p>
              </div>
            )}

            {/* 错误消息 */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded backdrop-blur-sm alert-shake">
                <div className="flex items-start gap-3">
                  <CircleAlert className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-200 text-sm">{error}</p>
                    {showResendVerification && (
                      <button
                        onClick={handleResendVerification}
                        className="text-amber-400 text-sm underline mt-2 hover:text-amber-300 transition-colors"
                      >
                        前往验证
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 登录表单 */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 邮箱输入 */}
              <div className="floating-input-group">
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
                <div className="input-underline" />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-2">{errors.email.message}</p>
                )}
              </div>

              {/* 密码输入 */}
              <div className="floating-input-group">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="floating-input pr-10"
                  placeholder=" "
                  {...register('password')}
                />
                <label htmlFor="password" className="floating-label">
                  密码
                </label>
                <div className="input-underline" />
                <button
                  type="button"
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-emerald-100/40 hover:text-amber-400 transition-colors p-2"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="切换密码显示"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-2">{errors.password.message}</p>
                )}
              </div>

              {/* 记住我 & 忘记密码 */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setValue('rememberMe', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border-2 border-amber-500/50 rounded peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all duration-300 flex items-center justify-center">
                      <Check className={cn(
                        "w-3 h-3 text-emerald-950 transition-all duration-300",
                        rememberMe ? "scale-100 opacity-100" : "scale-0 opacity-0"
                      )} />
                    </div>
                  </div>
                  <span className="text-emerald-100/60 group-hover:text-emerald-100 transition-colors">
                    记住我
                  </span>
                </label>
                <RouterLink
                  to="/forgot-password"
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  忘记密码？
                </RouterLink>
              </div>

              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-emerald-950 font-medium rounded relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover-glow"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  登录
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </form>

            {/* 分隔线 */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0f1f1a] px-4 text-emerald-100/40 text-xs tracking-wider">
                  或使用
                </span>
              </div>
            </div>

            {/* OAuth 登录 */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
                className="w-full py-3 border border-amber-500/30 text-emerald-100 rounded hover:border-amber-500/60 hover:bg-amber-500/5 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <Chrome className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
                <span>使用 Google 登录</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthLogin('github')}
                disabled={isLoading}
                className="w-full py-3 border border-amber-500/30 text-emerald-100 rounded hover:border-amber-500/60 hover:bg-amber-500/5 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <Github className="w-4 h-4 group-hover:text-amber-400 transition-colors" />
                <span>使用 GitHub 登录</span>
              </button>
            </div>

            {/* 注册链接 */}
            <div className="mt-8 text-center text-sm text-emerald-100/50">
              还没有账号？{' '}
              <RouterLink
                to="/register"
                className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
              >
                立即注册
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

      {/* 内联样式 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Manrope:wght@400;500;600;700&display=swap');

        .art-deco-login {
          font-family: 'Manrope', sans-serif;
        }

        .art-deco-login h1,
        .art-deco-login h2 {
          font-family: 'Playfair Display', serif;
        }

        /* 噪点纹理 */
        .bg-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        /* Logo 发光效果 */
        .logo-glow {
          text-shadow: 0 0 20px rgba(251, 191, 36, 0.3),
                       0 0 40px rgba(251, 191, 36, 0.2),
                       0 0 60px rgba(251, 191, 36, 0.1);
        }

        /* 玻璃态卡片 */
        .glass-card {
          background: rgba(15, 31, 26, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(217, 119, 6, 0.2);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37),
                      inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
        }

        /* 浮动输入框 */
        .floating-input-group {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .floating-input {
          width: 100%;
          padding: 1rem 0 0.5rem;
          background: transparent;
          border: none;
          border-bottom: 2px solid rgba(217, 119, 6, 0.2);
          color: rgb(236, 253, 245);
          font-size: 1rem;
          outline: none;
          transition: all 0.3s ease;
        }

        .floating-input:focus {
          border-bottom-color: rgb(217, 119, 6);
        }

        .floating-label {
          position: absolute;
          left: 0;
          top: 1rem;
          color: rgba(236, 253, 245, 0.5);
          font-size: 1rem;
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .floating-input:focus ~ .floating-label,
        .floating-input:not(:placeholder-shown) ~ .floating-label {
          top: -0.5rem;
          font-size: 0.75rem;
          color: rgb(251, 191, 36);
        }

        .input-underline {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, rgb(217, 119, 6), rgb(251, 191, 36));
          transform: translateX(-50%);
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .floating-input:focus ~ .input-underline {
          width: 100%;
        }

        /* 按钮发光效果 */
        .hover-glow {
          box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
        }

        .hover-glow:hover:not(:disabled) {
          box-shadow: 0 8px 24px rgba(217, 119, 6, 0.5),
                      0 0 40px rgba(251, 191, 36, 0.3);
          transform: translateY(-2px);
        }

        /* 动画 */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        .alert-slide-in {
          animation: slideInFromTop 0.5s ease-out;
        }

        .alert-shake {
          animation: slideInFromTop 0.5s ease-out, shake 0.5s ease-in-out 0.5s;
        }

        /* 装饰图案动画 */
        .deco-pattern {
          animation: fadeInUp 1.2s ease-out forwards;
        }

        /* 响应式 */
        @media (max-width: 768px) {
          .deco-pattern {
            display: none;
          }

          .glass-card {
            backdrop-filter: blur(10px);
          }

          .logo-glow {
            font-size: 3rem;
          }
        }
      `}</style>
    </div>
  );
};
