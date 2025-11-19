/**
 * 导航系统统一类型定义
 *
 * 这个文件定义了整个应用导航系统使用的核心类型。
 * 所有导航相关组件都应该使用这里定义的类型。
 */

import type { SvgIconProps } from '@mui/material';

/**
 * 用户角色类型
 *
 * - user: 普通用户
 * - admin: 管理员
 *
 * 注意：后端目前仅支持 'user' 和 'admin' 两种角色
 * 如需添加 'moderator' 角色，需要同步更新后端
 */
export type UserRole = 'user' | 'admin';

/**
 * 导航项配置
 *
 * 用于定义应用中的导航项,支持权限控制、层级关系和多场景显示。
 */
export interface NavigationItem {
  /** 唯一标识符 */
  id: string;

  /** 显示标签(用于导航栏、面包屑等) */
  label: string;

  /** 路由路径 */
  path: string;

  /** 图标组件(可选) */
  icon?: React.ComponentType<SvgIconProps>;

  /** 需要的角色权限 */
  roles: UserRole[];

  /** 是否禁用 */
  disabled?: boolean;

  /** 是否在导航栏中显示 */
  showInNav?: boolean;

  /** 是否在面包屑中显示 */
  showInBreadcrumb?: boolean;

  /** 父级导航项的 ID(用于构建面包屑层级) */
  parentId?: string;

  /** 是否在后面显示分隔符(用于移动端抽屉) */
  divider?: boolean;

  /** 排序权重(数字越小越靠前) */
  order?: number;
}

/**
 * 面包屑项
 *
 * 用于 Breadcrumbs 组件的数据结构。
 */
export interface BreadcrumbItem {
  /** 显示标签 */
  label: string;

  /** 路由路径 */
  path: string;

  /** 是否是当前页 */
  isActive?: boolean;
}

/**
 * 导航配置选项
 *
 * 用于筛选和处理导航项。
 */
export interface NavigationOptions {
  /** 只显示在导航栏中的项 */
  showInNavOnly?: boolean;

  /** 只显示在面包屑中的项 */
  showInBreadcrumbOnly?: boolean;

  /** 是否排除禁用项 */
  excludeDisabled?: boolean;

  /** 按排序权重排序 */
  sortByOrder?: boolean;
}
