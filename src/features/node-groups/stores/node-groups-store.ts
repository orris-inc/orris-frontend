/**
 * 节点组管理 Zustand 状态管理
 * 不使用持久化，数据从API实时获取
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  NodeGroupListItem,
  NodeGroupDetail,
  NodeGroupFilters,
  CreateNodeGroupRequest,
  UpdateNodeGroupRequest,
} from '../types/node-groups.types';
import type { NodeListItem } from '@/features/nodes/types/nodes.types';
import type { ListResponse } from '@/shared/types/api.types';
import {
  getNodeGroups as fetchNodeGroupsApi,
  getNodeGroupById as fetchNodeGroupByIdApi,
  createNodeGroup as createNodeGroupApi,
  updateNodeGroup as updateNodeGroupApi,
  deleteNodeGroup as deleteNodeGroupApi,
  getNodeGroupNodes as getNodeGroupNodesApi,
  addNodeToGroup as addNodeToGroupApi,
  batchAddNodesToGroup as batchAddNodesToGroupApi,
  batchRemoveNodesFromGroup as batchRemoveNodesFromGroupApi,
  removeNodeFromGroup as removeNodeFromGroupApi,
  getNodeGroupPlans as getNodeGroupPlansApi,
  associatePlanToGroup as associatePlanToGroupApi,
  dissociatePlanFromGroup as dissociatePlanFromGroupApi,
} from '../api/node-groups-api';
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

interface NodeGroupsState {
  // 状态
  nodeGroups: NodeGroupListItem[];
  selectedGroup: NodeGroupDetail | null;
  groupNodes: NodeListItem[]; // 当前选中组的节点列表
  filters: NodeGroupFilters;
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  loading: boolean;
  error: string | null;

  // 基础 CRUD 方法
  fetchNodeGroups: (page?: number, pageSize?: number) => Promise<void>;
  fetchNodeGroupById: (id: number | string) => Promise<void>;
  createNodeGroup: (data: CreateNodeGroupRequest) => Promise<NodeGroupListItem | null>;
  updateNodeGroup: (id: number | string, data: UpdateNodeGroupRequest) => Promise<NodeGroupListItem | null>;
  deleteNodeGroup: (id: number | string) => Promise<boolean>;

  // 节点关联管理方法
  fetchGroupNodes: (groupId: number | string) => Promise<void>;
  addNodeToGroup: (groupId: number | string, nodeId: number) => Promise<boolean>;
  batchAddNodesToGroup: (groupId: number | string, nodeIds: number[]) => Promise<boolean>;
  batchRemoveNodesFromGroup: (groupId: number | string, nodeIds: number[]) => Promise<boolean>;
  removeNodeFromGroup: (groupId: number | string, nodeId: number | string) => Promise<boolean>;

  // 订阅计划关联方法
  fetchGroupPlans: (groupId: number | string) => Promise<any[]>;
  associatePlan: (groupId: number | string, planId: number | string) => Promise<boolean>;
  dissociatePlan: (groupId: number | string, planId: number | string) => Promise<boolean>;

  // 辅助方法
  setFilters: (filters: Partial<NodeGroupFilters>) => void;
  setSelectedGroup: (group: NodeGroupDetail | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  nodeGroups: [],
  selectedGroup: null,
  groupNodes: [],
  filters: {} as NodeGroupFilters,
  pagination: {
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 0,
  },
  loading: false,
  error: null,
};

export const useNodeGroupsStore = create<NodeGroupsState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ==================== 基础 CRUD ====================

      // 获取节点组列表
      fetchNodeGroups: async (page = 1, pageSize = 20) => {
        set({ loading: true, error: null });

        try {
          const filters = get().filters;
          const response: ListResponse<NodeGroupListItem> = await fetchNodeGroupsApi({
            page,
            page_size: pageSize,
            is_public: filters.is_public,
          });

          set({
            nodeGroups: response.items || [],
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

      // 获取指定节点组详情
      fetchNodeGroupById: async (id: number | string) => {
        set({ loading: true, error: null });

        try {
          const group = await fetchNodeGroupByIdApi(id);
          set({ selectedGroup: group, loading: false });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
        }
      },

      // 创建节点组
      createNodeGroup: async (data: CreateNodeGroupRequest) => {
        set({ loading: true, error: null });

        try {
          const newGroup = await createNodeGroupApi(data);
          showNotification('节点组创建成功', 'success');

          // 刷新列表
          await get().fetchNodeGroups(get().pagination.page, get().pagination.page_size);

          set({ loading: false });
          return newGroup;
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
          return null;
        }
      },

      // 更新节点组信息
      updateNodeGroup: async (id: number | string, data: UpdateNodeGroupRequest) => {
        set({ loading: true, error: null });

        try {
          const updatedGroup = await updateNodeGroupApi(id, data);
          showNotification('节点组信息更新成功', 'success');

          // 刷新列表
          await get().fetchNodeGroups(get().pagination.page, get().pagination.page_size);

          set({ loading: false });
          return updatedGroup;
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, loading: false });
          showNotification(errorMessage, 'error');
          return null;
        }
      },

      // 删除节点组
      deleteNodeGroup: async (id: number | string) => {
        try {
          await deleteNodeGroupApi(id);
          showNotification('节点组删除成功', 'success');

          // 刷新列表
          await get().fetchNodeGroups(get().pagination.page, get().pagination.page_size);

          return true;
        } catch (error) {
          const errorMessage = handleApiError(error);
          showNotification(errorMessage, 'error');
          return false;
        }
      },

      // ==================== 节点关联管理 ====================

      // 获取节点组中的所有节点
      fetchGroupNodes: async (groupId: number | string) => {
        set({ loading: true, error: null });

        try {
          const nodes = await getNodeGroupNodesApi(groupId);
          set({ groupNodes: nodes || [], loading: false });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ error: errorMessage, groupNodes: [], loading: false });
          showNotification(errorMessage, 'error');
        }
      },

      // 添加单个节点到组
      addNodeToGroup: async (groupId: number | string, nodeId: number) => {
        try {
          await addNodeToGroupApi(groupId, { node_id: nodeId });
          showNotification('节点添加成功', 'success');

          // 刷新节点列表
          await get().fetchGroupNodes(groupId);

          return true;
        } catch (error) {
          const errorMessage = handleApiError(error);
          showNotification(errorMessage, 'error');
          return false;
        }
      },

      // 批量添加节点到组
      batchAddNodesToGroup: async (groupId: number | string, nodeIds: number[]) => {
        try {
          await batchAddNodesToGroupApi(groupId, { node_ids: nodeIds });
          showNotification(`成功添加 ${nodeIds.length} 个节点`, 'success');

          // 刷新节点列表
          await get().fetchGroupNodes(groupId);

          return true;
        } catch (error) {
          const errorMessage = handleApiError(error);
          showNotification(errorMessage, 'error');
          return false;
        }
      },

      // 批量从组中移除节点
      batchRemoveNodesFromGroup: async (groupId: number | string, nodeIds: number[]) => {
        try {
          await batchRemoveNodesFromGroupApi(groupId, { node_ids: nodeIds });
          showNotification(`成功移除 ${nodeIds.length} 个节点`, 'success');

          // 刷新节点列表
          await get().fetchGroupNodes(groupId);

          return true;
        } catch (error) {
          const errorMessage = handleApiError(error);
          showNotification(errorMessage, 'error');
          return false;
        }
      },

      // 从组中移除单个节点
      removeNodeFromGroup: async (groupId: number | string, nodeId: number | string) => {
        try {
          await removeNodeFromGroupApi(groupId, nodeId);
          showNotification('节点移除成功', 'success');

          // 刷新节点列表
          await get().fetchGroupNodes(groupId);

          return true;
        } catch (error) {
          const errorMessage = handleApiError(error);
          showNotification(errorMessage, 'error');
          return false;
        }
      },

      // ==================== 订阅计划关联管理 ====================

      // 获取节点组关联的订阅计划
      fetchGroupPlans: async (groupId: number | string) => {
        try {
          const plans = await getNodeGroupPlansApi(groupId);
          return plans || [];
        } catch (error) {
          const errorMessage = handleApiError(error);
          showNotification(errorMessage, 'error');
          return [];
        }
      },

      // 关联订阅计划到节点组
      associatePlan: async (groupId: number | string, planId: number | string) => {
        try {
          await associatePlanToGroupApi(groupId, planId);
          showNotification('订阅计划关联成功', 'success');
          return true;
        } catch (error) {
          const errorMessage = handleApiError(error);
          showNotification(errorMessage, 'error');
          return false;
        }
      },

      // 取消订阅计划关联
      dissociatePlan: async (groupId: number | string, planId: number | string) => {
        try {
          await dissociatePlanFromGroupApi(groupId, planId);
          showNotification('订阅计划关联已取消', 'success');
          return true;
        } catch (error) {
          const errorMessage = handleApiError(error);
          showNotification(errorMessage, 'error');
          return false;
        }
      },

      // ==================== 辅助方法 ====================

      // 设置筛选条件
      setFilters: (filters: Partial<NodeGroupFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
        // 应用筛选后重新获取第一页数据
        get().fetchNodeGroups(1, get().pagination.page_size);
      },

      // 设置选中的节点组
      setSelectedGroup: (group: NodeGroupDetail | null) => {
        set({ selectedGroup: group });
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
    { name: 'node-groups-store' }
  )
);
