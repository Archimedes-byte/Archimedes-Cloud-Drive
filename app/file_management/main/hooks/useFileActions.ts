import { useState, useCallback } from 'react';
import { message } from 'antd';
import { getFileNameAndExtension } from '../../utils/fileHelpers';

// 定义更完整的文件类型
interface FileType {
  id: string;
  name: string;
  type?: string;
  extension?: string;
  size?: number;
  isFolder?: boolean;
  createdAt?: string | Date;
  tags?: string[];
  parentId?: string | null;
}

export const useFileActions = (onSuccessCallback: () => void) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderTags, setNewFolderTags] = useState<string[]>([]);
  const [newFolderTagInput, setNewFolderTagInput] = useState<string>('');

  // 处理下载
  const handleDownload = useCallback(async () => {
    try {
      if (selectedFiles.length === 0) {
        message.warning('请选择要下载的文件');
        return;
      }

      // 暂时只支持单文件下载
      if (selectedFiles.length > 1) {
        message.info('目前仅支持单文件下载，将下载第一个选中的文件');
      }

      const fileId = selectedFiles[0];
      window.open(`/api/files/${fileId}/download`);
    } catch (error) {
      console.error('下载错误:', error);
      message.error('下载失败');
    }
  }, [selectedFiles]);

  // 处理删除
  const handleDelete = useCallback(async () => {
    try {
      if (selectedFiles.length === 0) {
        message.warning('请选择要删除的文件');
        return;
      }

      const confirmed = window.confirm(`确定要删除选中的 ${selectedFiles.length} 个文件/文件夹吗？`);
      if (!confirmed) return;

      // 逐个删除文件
      const promises = selectedFiles.map(fileId =>
        fetch(`/api/files/${fileId}`, {
          method: 'DELETE',
        })
      );

      await Promise.all(promises);
      message.success('删除成功');
      setSelectedFiles([]);
      onSuccessCallback();
    } catch (error) {
      console.error('删除错误:', error);
      message.error('删除失败');
    }
  }, [selectedFiles, onSuccessCallback]);

  // 开始编辑
  const handleStartEdit = useCallback((file: FileType) => {
    setEditingFile(file.id);
    setEditingName(file.name);
    setEditingTags(file.tags || []);
  }, []);

  // 提交编辑
  const handleConfirmEdit = useCallback((files: FileType[]) => {
    const file = files.find(f => f.id === editingFile);
    
    if (!file || !editingName.trim()) {
      message.warning('文件名不能为空');
      return;
    }

    // 如果文件名没有变化且标签没有变化，则不需要更新
    if (file.name === editingName && 
        JSON.stringify(file.tags || []) === JSON.stringify(editingTags)) {
      setEditingFile(null);
      return;
    }

    // 避免文件名与扩展名分离
    let newName = editingName;
    if (!file.isFolder && file.name.includes('.')) {
      const { extension } = getFileNameAndExtension(file.name);
      if (extension && !editingName.endsWith(`.${extension}`)) {
        newName = `${editingName}.${extension}`;
      }
    }

    // 发送更新请求
    fetch(`/api/files/${file.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newName,
        tags: editingTags,
      }),
    })
      .then(response => {
        if (!response.ok) throw new Error('更新失败');
        return response.json();
      })
      .then(() => {
        message.success('更新成功');
        setEditingFile(null);
        onSuccessCallback();
      })
      .catch(error => {
        console.error('更新错误:', error);
        message.error('更新失败');
      });
  }, [editingFile, editingName, editingTags, onSuccessCallback]);

  // 创建文件夹
  const handleCreateFolder = useCallback(async (currentFolderId: string | null) => {
    try {
      if (!newFolderName.trim()) {
        message.warning('请输入文件夹名称');
        return;
      }
        
      console.log('准备创建文件夹:', {
        name: newFolderName,
        parentId: currentFolderId,
        tags: newFolderTags
      });

      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolderId,
          tags: newFolderTags
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('创建文件夹响应错误:', {
          状态: response.status,
          数据: responseData
        });
        throw new Error(responseData.error || '创建文件夹失败');
      }

      console.log('文件夹创建成功:', responseData);
      message.success('创建文件夹成功');
      
      // 重置状态
      setIsCreatingFolder(false);
      setNewFolderName('');
      setNewFolderTags([]);
      setNewFolderTagInput('');
      onSuccessCallback();
    } catch (error) {
      console.error('创建文件夹错误:', error);
      message.error(`创建文件夹失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [newFolderName, newFolderTags, onSuccessCallback, setIsCreatingFolder, setNewFolderName, setNewFolderTags, setNewFolderTagInput]);

  // 文件选择
  const handleSelectFile = useCallback((fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles(prev => [...prev, fileId]);
    } else {
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
    }
  }, []);

  // 标签操作
  const handleAddTag = useCallback((tag: string) => {
    if (!tag.trim()) return;
    if (!editingTags.includes(tag.trim())) {
      setEditingTags([...editingTags, tag.trim()]);
    }
  }, [editingTags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setEditingTags(editingTags.filter(tag => tag !== tagToRemove));
  }, [editingTags]);

  return {
    selectedFiles,
    setSelectedFiles,
    editingFile,
    setEditingFile,
    editingName,
    setEditingName,
    editingTags,
    setEditingTags,
    isCreatingFolder,
    setIsCreatingFolder,
    newFolderName,
    setNewFolderName,
    newFolderTags,
    setNewFolderTags,
    newFolderTagInput,
    setNewFolderTagInput,
    handleDownload,
    handleDelete,
    handleStartEdit,
    handleConfirmEdit,
    handleCreateFolder,
    handleSelectFile,
    handleAddTag,
    handleRemoveTag
  };
}; 