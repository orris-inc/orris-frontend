/**
 * useNodes Hook
 * 管理端使用，包含完整的节点管理操作
 */

import { useEffect, useRef } from 'react';
import { useNodesStore } from '../stores/nodes-store';
import type { CreateNodeRequest, UpdateNodeRequest } from '../types/nodes.types';

export const useNodes = () => {
  const {
    nodes,
    selectedNode,
    filters,
    pagination,
    loading,
    error,
    fetchNodes,
    fetchNodeById,
    createNode,
    updateNode,
    deleteNode,
    updateNodeStatus,
    generateToken,
    setFilters,
    setSelectedNode,
    clearError,
    reset,
  } = useNodesStore();

  // 使用ref防止StrictMode导致的重复调用
  const initialized = useRef(false);

  // 组件挂载时获取数据（只运行一次，即使在StrictMode下）
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      fetchNodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 创建节点（带类型）
  const handleCreateNode = async (data: CreateNodeRequest) => {
    return await createNode(data);
  };

  // 更新节点信息（带类型）
  const handleUpdateNode = async (id: number | string, data: UpdateNodeRequest) => {
    return await updateNode(id, data);
  };

  // 删除节点
  const handleDeleteNode = async (id: number | string) => {
    return await deleteNode(id);
  };

  // 更新节点状态
  const handleUpdateNodeStatus = async (
    id: number | string,
    status: 'active' | 'inactive' | 'maintenance'
  ) => {
    return await updateNodeStatus(id, status);
  };

  // 生成Token
  const handleGenerateToken = async (id: number | string) => {
    return await generateToken(id);
  };

  return {
    // 状态
    nodes,
    selectedNode,
    filters,
    pagination,
    loading,
    error,

    // 方法
    fetchNodes,
    fetchNodeById,
    createNode: handleCreateNode,
    updateNode: handleUpdateNode,
    deleteNode: handleDeleteNode,
    updateNodeStatus: handleUpdateNodeStatus,
    generateToken: handleGenerateToken,
    setFilters,
    setSelectedNode,
    clearError,
    reset,
  };
};
