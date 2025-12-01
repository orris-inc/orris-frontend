/**
 * 节点管理 Zustand 状态管理
 * 不使用持久化，数据从API实时获取
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { NodeListItem, NodeFilters, CreateNodeRequest, UpdateNodeRequest } from '../types/nodes.types';
import type { ListResponse } from '@/shared/types/api.types';
import {
  getNodes as fetchNodesApi,
  getNodeById as fetchNodeByIdApi,
  createNode as createNodeApi,
  updateNode as updateNodeApi,
  deleteNode as deleteNodeApi,
  updateNodeStatus as updateNodeStatusApi,
  generateNodeToken as generateNodeTokenApi,
} from '../api/nodes-api';
import { handleApiError } from '@/shared/lib/axios';
import { useNotificationStore } from '@/shared/stores/notification-store';

// 辅助函数：根据类型显示通知
const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
  const notificationStore = useNotificationStore.getState();
  switch (type) {
    case 'success':
      notificationStore.showSuccess(message);
      break;
    case 'error':
      notificationStore.showError(message);
      break;
    case 'info':
      notificationStore.showInfo(message);
      break;
    case 'warning':
      notificationStore.showWarning(message);
      break;
  }
};

interface NodesState {
  // 状态
  nodes: NodeListItem[];
  selectedNode: NodeListItem | null;
  filters: NodeFilters;
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  loading: boolean;
  error: string | null;

  // 方法
  fetchNodes: (page?: number, pageSize?: number) => Promise<void>;
  fetchNodeById: (id: number | string) => Promise<void>;
  createNode: (data: CreateNodeRequest) => Promise<NodeListItem | null>;
  updateNode: (id: number | string, data: UpdateNodeRequest) => Promise<NodeListItem | null>;
  deleteNode: (id: number | string) => Promise<boolean>;
  updateNodeStatus: (id: number | string, status: 'active' | 'inactive' | 'maintenance') => Promise<boolean>;
  generateToken: (id: number | string) => Promise<string | null>;
  setFilters: (filters: Partial<NodeFilters>) => void;
  setSelectedNode: (node: NodeListItem | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  nodes: [],
  selectedNode: null,
  filters: {} as NodeFilters,
  pagination: {
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 0,
  },
  loading: false,
  error: null,
};

export const useNodesStore = create<NodesState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 获取节点列表
      fetchNodes: async (page = 1, pageSize = 20) => {
        set({ loading: true, error: null });

        try {
          const filters = get().filters;
          const response: ListResponse<NodeListItem> = await fetchNodesApi({
            page,
            page_size: pageSize,
            ...filters,
          });

          set({
            nodes: response.items || [],
            pagination: {
              page: response.page,
              page_size: response.page_size,
              total: response.total,
              total_pages: response.total_pages,
            },
            loading: false,
          });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
        }
      },

      // 获取指定节点详情
      fetchNodeById: async (id: number | string) => {
        set({ loading: true, error: null });

        try {
          const node = await fetchNodeByIdApi(id);
          set({ selectedNode: node as NodeListItem, loading: false });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
        }
      },

      // 创建节点
      createNode: async (data: CreateNodeRequest) => {
        set({ loading: true, error: null });

        try {
          const newNode = await createNodeApi(data);
          showNotification('节点创建成功', 'success');

          // 刷新列表
          await get().fetchNodes(get().pagination.page, get().pagination.page_size);

          set({ loading: false });
          return newNode;
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
          return null;
        }
      },

      // 更新节点信息
      updateNode: async (id: number | string, data: UpdateNodeRequest) => {
        set({ loading: true, error: null });

        try {
          const updatedNode = await updateNodeApi(id, data);
          showNotification('节点信息更新成功', 'success');

          // 刷新列表
          await get().fetchNodes(get().pagination.page, get().pagination.page_size);

          set({ loading: false });
          return updatedNode;
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
          return null;
        }
      },

      // 删除节点
      deleteNode: async (id: number | string) => {
        try {
          await deleteNodeApi(id);
          showNotification('节点删除成功', 'success');

          // 刷新列表
          await get().fetchNodes(get().pagination.page, get().pagination.page_size);

          return true;
        } catch (error) {
          const errorMessage = handleApiError(error);
          showNotification(errorMessage, 'error');
          return false;
        }
      },

      // 更新节点状态
      updateNodeStatus: async (id: number | string, status: 'active' | 'inactive' | 'maintenance') => {
        try {
          await updateNodeStatusApi(id, { status });
          const statusMessages = {
            active: '节点已激活',
            inactive: '节点已停用',
            maintenance: '节点已设为维护中',
          };
          showNotification(statusMessages[status], 'success');

          // 刷新列表
          await get().fetchNodes(get().pagination.page, get().pagination.page_size);

          return true;
        } catch (error) {
          const errorMessage = handleApiError(error);
          showNotification(errorMessage, 'error');
          return false;
        }
      },

      // 生成节点Token
      generateToken: async (id: number | string) => {
        try {
          const response = await generateNodeTokenApi(id);

          // 后端返回的是PascalCase的Token字段
          const token = response?.Token;

          if (!token || typeof token !== 'string') {
            showNotification('Token生成失败：未返回有效的Token', 'error');
            return null;
          }

          showNotification('Token生成成功', 'success');
          return token;
        } catch (error) {
          const errorMessage = handleApiError(error);
          showNotification(errorMessage, 'error');
          return null;
        }
      },

      // 设置筛选条件
      setFilters: (filters: Partial<NodeFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
        // 应用筛选后重新获取第一页数据
        get().fetchNodes(1, get().pagination.page_size);
      },

      // 设置选中的节点
      setSelectedNode: (node: NodeListItem | null) => {
        set({ selectedNode: node });
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },

      // 重置状态
      reset: () => {
        set(initialState);
      },
    }),
    { name: 'nodes-store' }
  )
);
