/**
 * usePageTitle Hook
 * 用于动态设置页面标题
 */

import { useEffect } from 'react';

/**
 * 设置页面标题
 * @param title 页面标题（不包含应用名称）
 * @param appName 应用名称，默认为 "Orris"
 *
 * @example
 * ```tsx
 * usePageTitle('用户管理'); // 页面标题: Orris - 用户管理
 * usePageTitle('Dashboard', 'MyApp'); // 页面标题: MyApp - Dashboard
 * ```
 */
export const usePageTitle = (title: string, appName = 'Orris') => {
  useEffect(() => {
    const fullTitle = title ? `${appName} - ${title}` : appName;
    document.title = fullTitle;

    // 清理函数：组件卸载时恢复默认标题
    return () => {
      document.title = appName;
    };
  }, [title, appName]);
};
