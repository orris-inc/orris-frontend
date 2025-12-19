/**
 * 登录页面 - 流动光影（Fluid Luminance）
 * 设计风格：玻璃态拟态 + 流动渐变 + 霓虹发光
 * 配色：紫罗兰-蓝色-青色渐变 + 深色背景
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { Loader2, Mail, Lock, Chrome, Github, AlertCircle, CheckCircle2 } from 'lucide-react';
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

export const LoginPageGlass = () => {
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
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* 动态渐变背景 */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950 via-slate-900 to-cyan-950">
        {/* 流动渐变动画层 */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0 animate-gradient-flow bg-gradient-to-r from-violet-600/30 via-blue-600/30 to-cyan-600/30 blur-3xl" />
          <div className="absolute inset-0 animate-gradient-flow-reverse bg-gradient-to-l from-purple-600/20 via-indigo-600/20 to-blue-600/20 blur-3xl"
               style={{ animationDelay: '2s' }} />
        </div>

        {/* 网格背景 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

        {/* 浮动光点 */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-violet-400 rounded-full blur-sm animate-float-slow" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-cyan-400 rounded-full blur-sm animate-float-medium" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-400 rounded-full blur-sm animate-float-fast" style={{ animationDelay: '2s' }} />
        <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-purple-400 rounded-full blur-sm animate-float-slow" style={{ animationDelay: '3s' }} />
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* 玻璃态卡片 */}
          <div className="glass-card group animate-fade-in-up">
            {/* Logo 和标题 */}
            <div className="text-center mb-8">
              <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 mb-3 animate-gradient-text">
                Orris
              </h1>
              <p className="text-slate-300 text-lg font-medium">
                欢迎回来
              </p>
              <p className="text-slate-500 text-sm mt-1">
                登录您的账号继续使用
              </p>
            </div>

            {/* 成功消息 */}
            {successMessage && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm flex items-start gap-3 animate-slide-down">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-emerald-300 text-sm leading-relaxed">{successMessage}</p>
              </div>
            )}

            {/* 错误消息 */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm animate-shake">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                    {showResendVerification && (
                      <button
                        onClick={handleResendVerification}
                        className="text-violet-400 text-sm underline mt-2 hover:text-violet-300 transition-colors"
                      >
                        前往验证
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 登录表单 */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* 邮箱输入 */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  邮箱地址
                </label>
                <div className="relative group/input">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-focus-within/input:text-violet-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="input-glow w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all duration-300"
                    placeholder="your@email.com"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1 animate-shake">{errors.email.message}</p>
                )}
              </div>

              {/* 密码输入 */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  密码
                </label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-focus-within/input:text-violet-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="input-glow w-full pl-12 pr-20 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all duration-300"
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-400 text-sm font-medium transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? '隐藏' : '显示'}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1 animate-shake">{errors.password.message}</p>
                )}
              </div>

              {/* 记住我 & 忘记密码 */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group/checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setValue('rememberMe', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-0 transition-all"
                  />
                  <span className="text-slate-400 group-hover/checkbox:text-slate-300 transition-colors">
                    记住我
                  </span>
                </label>
                <RouterLink
                  to="/forgot-password"
                  className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
                >
                  忘记密码？
                </RouterLink>
              </div>

              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-glow w-full py-3.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </button>
            </form>

            {/* 分隔线 */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-sm text-slate-500 bg-slate-900/50">
                  或使用以下方式登录
                </span>
              </div>
            </div>

            {/* OAuth 登录按钮 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
                className="oauth-btn flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 text-slate-300 hover:text-white group"
              >
                <Chrome className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="font-medium">Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthLogin('github')}
                disabled={isLoading}
                className="oauth-btn flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 text-slate-300 hover:text-white group"
              >
                <Github className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="font-medium">GitHub</span>
              </button>
            </div>

            {/* 注册链接 */}
            <div className="mt-8 text-center text-sm">
              <span className="text-slate-400">还没有账号？</span>{' '}
              <RouterLink
                to="/register"
                className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
              >
                立即注册
              </RouterLink>
            </div>
          </div>

          {/* 底部装饰 */}
          <div className="mt-6 text-center">
            <p className="text-slate-600 text-xs">
              使用现代浏览器以获得最佳体验
            </p>
          </div>
        </div>
      </div>

      {/* 内联样式 - Tailwind 动画扩展 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* 玻璃态卡片 */
        .glass-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow:
            0 0 0 1px rgba(139, 92, 246, 0.1),
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 0 64px rgba(139, 92, 246, 0.1);
          position: relative;
          overflow: hidden;
        }

        .glass-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 24px;
          padding: 1px;
          background: linear-gradient(135deg,
            rgba(139, 92, 246, 0.3),
            rgba(59, 130, 246, 0.2),
            rgba(6, 182, 212, 0.3)
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        /* 输入框聚焦发光 */
        .input-glow:focus {
          box-shadow:
            0 0 0 1px rgba(139, 92, 246, 0.5),
            0 0 20px rgba(139, 92, 246, 0.2),
            0 0 40px rgba(139, 92, 246, 0.1);
        }

        /* 按钮发光 */
        .btn-glow:hover:not(:disabled) {
          box-shadow:
            0 0 40px rgba(139, 92, 246, 0.4),
            0 0 80px rgba(139, 92, 246, 0.2);
        }

        .btn-glow:active:not(:disabled) {
          transform: scale(0.98);
        }

        /* OAuth 按钮悬停 */
        .oauth-btn:hover {
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
        }

        /* 渐变流动动画 */
        @keyframes gradient-flow {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(10%, 10%) scale(1.1);
          }
          66% {
            transform: translate(-10%, -10%) scale(0.9);
          }
        }

        @keyframes gradient-flow-reverse {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-10%, -10%) scale(0.9);
          }
          66% {
            transform: translate(10%, 10%) scale(1.1);
          }
        }

        .animate-gradient-flow {
          animation: gradient-flow 15s ease-in-out infinite;
        }

        .animate-gradient-flow-reverse {
          animation: gradient-flow-reverse 12s ease-in-out infinite;
        }

        /* 渐变文字动画 */
        @keyframes gradient-text {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient-text {
          background-size: 200% 200%;
          animation: gradient-text 3s ease-in-out infinite;
        }

        /* 浮动动画 */
        @keyframes float-slow {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.3;
          }
          50% {
            transform: translate(20px, -20px);
            opacity: 0.6;
          }
        }

        @keyframes float-medium {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.4;
          }
          50% {
            transform: translate(-15px, 25px);
            opacity: 0.7;
          }
        }

        @keyframes float-fast {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.3;
          }
          50% {
            transform: translate(25px, 15px);
            opacity: 0.6;
          }
        }

        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }

        .animate-float-medium {
          animation: float-medium 6s ease-in-out infinite;
        }

        .animate-float-fast {
          animation: float-fast 4s ease-in-out infinite;
        }

        /* 淡入上移动画 */
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        /* 下滑动画 */
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }

        /* 抖动动画 */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        /* 响应式 */
        @media (max-width: 640px) {
          .glass-card {
            padding: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
};
