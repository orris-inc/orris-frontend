/**
 * API 通用响应类型
 * 基于后端 Swagger 文档定义
 */

export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  error?: APIError;
}

export interface APIError {
  type: string;
  message: string;
  details: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * 列表响应类型（后端实际使用的格式）
 * 来源: swagger.json line 6835-6852
 * 路径: #/definitions/orris_internal_shared_utils.ListResponse
 */
export interface ListResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}
