/**
 * 文件夹相关类型定义
 * 
 * 包含文件夹的基本数据结构和操作相关的类型定义
 */

import { BaseEntity } from '../core/common';

// 文件夹信息接口
export interface FolderInfo extends BaseEntity {
  name: string;
  parentId: string | null;
}

// 文件夹路径项
export interface FolderPath {
  id: string;
  name: string;
}

// 文件夹结构接口
export interface FolderStructure {
  path: string;
  files: any[]; // 使用具体的文件类型替代any
  subFolders: Map<string, FolderStructure>;
}

// 文件树节点接口
export interface FileTreeNode {
  name: string;
  type: 'file' | 'folder';
  size: number;
  children?: FileTreeNode[];
  file?: globalThis.File & { webkitRelativePath?: string };
}

// 面包屑导航项
export interface BreadcrumbItem {
  id: string | null;
  name: string;
  path?: string;
}

// 文件夹创建请求
export interface FolderCreateRequest {
  name: string;
  parentId?: string | null;
  tags?: string[];
} 