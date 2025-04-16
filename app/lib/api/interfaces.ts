/**
 * 文件列表请求参数
 */
export interface FileListRequest {
  folderId?: string | null;
  type?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
  recursive?: boolean;
  signal?: AbortSignal;
  _t?: number; // 时间戳参数，防止浏览器缓存
} 