/**
 * 登录页面选择器 - 用于预览和切换不同的登录页面设计
 */

import { Link as RouterLink } from 'react-router';

export const LoginSelector = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
      <div className="w-full max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            选择登录页面风格
          </h1>
          <p className="text-slate-600">
            查看和选择您喜欢的登录页面设计
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 标准设计 */}
          <RouterLink
            to="/login"
            className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-2xl font-bold mb-2">Orris</div>
                  <div className="text-sm opacity-80">欢迎回来</div>
                </div>
              </div>
              <div className="absolute inset-0 bg-grid-white/10" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                标准设计
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                左右分栏布局，渐变装饰背景，现代简洁风格
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">经典</span>
                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">商务</span>
              </div>
            </div>
          </RouterLink>

          {/* Art Deco 设计 */}
          <RouterLink
            to="/login-new"
            className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-emerald-900 to-emerald-800 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-amber-400 text-center">
                  <div className="text-2xl font-serif tracking-widest mb-2">ORRIS</div>
                  <div className="text-sm opacity-80">优雅登录体验</div>
                </div>
              </div>
              <svg className="absolute top-4 right-4 w-16 h-16 opacity-20" viewBox="0 0 100 100">
                <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="none" stroke="currentColor" strokeWidth="1" className="text-amber-400"/>
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                Art Deco 风格
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                深色系，装饰图案，玻璃态效果，奢华精致
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded">奢华</span>
                <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded">艺术</span>
              </div>
            </div>
          </RouterLink>

          {/* 极简设计 */}
          <RouterLink
            to="/login-minimal"
            className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="aspect-[4/3] bg-[#F7F5F2] relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[#2B2926] text-center">
                  <div className="w-10 h-px bg-[#2B2926]/30 mx-auto mb-6 animate-pulse" />
                  <div className="text-2xl font-serif tracking-widest mb-2">Orris</div>
                  <div className="text-sm text-[#7A7672] mb-4">欢迎回来</div>
                  <div className="w-24 h-px bg-[#6B8E6F]/20 mx-auto" />
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-[#6B8E6F] transition-colors">
                极简风格
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                75%留白，温暖中性色调，呼吸线动画，专注体验
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 bg-slate-50 text-slate-700 rounded">简约</span>
                <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">宁静</span>
              </div>
            </div>
          </RouterLink>

          {/* 流动光影 - Tailwind */}
          <RouterLink
            to="/login-glass"
            className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-violet-950 via-slate-900 to-cyan-950 relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.1)_1px,transparent_1px)] bg-[size:32px_32px]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center relative">
                  <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 mb-2">
                    Orris
                  </div>
                  <div className="text-sm text-slate-400">欢迎回来</div>
                </div>
              </div>
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-violet-400 rounded-full blur-sm animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-cyan-400 rounded-full blur-sm animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-violet-600 transition-colors">
                流动光影
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                玻璃态拟态，流动渐变背景，霓虹发光效果，科技感
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 bg-violet-50 text-violet-700 rounded">Tailwind</span>
                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">现代</span>
                <span className="text-xs px-2 py-1 bg-cyan-50 text-cyan-700 rounded">科技</span>
              </div>
            </div>
          </RouterLink>

          {/* Apple 简约风格 */}
          <RouterLink
            to="/login-apple"
            className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ring-2 ring-slate-200/50"
          >
            <div className="aspect-[4/3] bg-[#f5f5f7] relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center relative">
                  <div className="text-2xl font-semibold text-[#1d1d1f] tracking-tight mb-2">登录 Orris</div>
                  <div className="text-xs text-[#86868b]">使用您的 Orris ID</div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors flex items-center gap-2">
                Apple 简约
                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-normal">NEW</span>
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                极致简约，优雅精致，SF Pro 字体，Apple 设计语言
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 bg-slate-50 text-slate-700 rounded">Apple</span>
                <span className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded">简约</span>
                <span className="text-xs px-2 py-1 bg-stone-50 text-stone-700 rounded">精致</span>
              </div>
            </div>
          </RouterLink>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          💡 提示：所有页面功能完全相同，只是设计风格不同
        </div>
      </div>
    </div>
  );
};
