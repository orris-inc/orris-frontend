/**
 * 节点组管理 React Hook
 * 封装节点组状态管理逻辑
 */

import { useEffect } from 'react';
import { useNodeGroupsStore } from '../stores/node-groups-store';

/**
 * 节点组管理 Hook
 * @param autoFetch 是否自动加载数据，默认 false
 */
export const useNodeGroups = (autoFetch = false) => {
  const {
    nodeGroups,
    selectedGroup,
    groupNodes,
    filters,
    pagination,
    loading,
    error,
    fetchNodeGroups,
    fetchNodeGroupById,
    createNodeGroup,
    updateNodeGroup,
    deleteNodeGroup,
    fetchGroupNodes,
    addNodeToGroup,
    batchAddNodesToGroup,
    batchRemoveNodesFromGroup,
    removeNodeFromGroup,
    fetchGroupPlans,
    associatePlan,
    dissociatePlan,
    setFilters,
    setSelectedGroup,
    clearError,
    reset,
  } = useNodeGroupsStore();

  // 自动加载数据
  useEffect(() => {
    if (autoFetch) {
      fetchNodeGroups();
    }
  }, [autoFetch, fetchNodeGroups]);

  return {
    // 状态
    nodeGroups,
    selectedGroup,
    groupNodes,
    filters,
    pagination,
    loading,
    error,

    // 基础 CRUD 方法
    fetchNodeGroups,
    fetchNodeGroupById,
    createNodeGroup,
    updateNodeGroup,
    deleteNodeGroup,

    // 节点关联管理方法
    fetchGroupNodes,
    addNodeToGroup,
    batchAddNodesToGroup,
    batchRemoveNodesFromGroup,
    removeNodeFromGroup,

    // 订阅计划关联方法
    fetchGroupPlans,
    associatePlan,
    dissociatePlan,

    // 辅助方法
    setFilters,
    setSelectedGroup,
    clearError,
    reset,
  };
};
