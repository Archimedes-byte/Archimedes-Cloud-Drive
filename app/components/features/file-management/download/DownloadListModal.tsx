import React, { useState, useEffect } from 'react';
import { Modal, Typography, Button, List, Space, Spin, Alert, Flex, Checkbox, Input, Badge, Tooltip } from 'antd';
import { DownloadOutlined, FileOutlined, FolderOutlined, DeleteOutlined, InfoCircleOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { FileInfo } from '@/app/types';
import styles from './DownloadListModal.module.css';

export interface DownloadListModalProps {
  /**
   * 是否显示模态框
   */
  visible: boolean;
  /**
   * 所有要下载的文件信息列表
   */
  fileList: FileInfo[];
  /**
   * 取消操作回调
   */
  onCancel: () => void;
  /**
   * 确认下载回调
   */
  onDownload: (fileName?: string) => void;
  /**
   * 是否处于下载中状态
   */
  loading?: boolean;
  /**
   * 更新文件列表回调
   */
  onUpdateFileList?: (files: FileInfo[]) => void;
}

/**
 * 下载列表模态框组件
 * 在下载前展示所有要下载的文件和文件夹列表
 */
export const DownloadListModal: React.FC<DownloadListModalProps> = ({
  visible,
  fileList,
  onCancel,
  onDownload,
  loading,
  onUpdateFileList
}) => {
  // 计算文件夹和文件数量
  const folderCount = fileList.filter(file => file.isFolder).length;
  const fileCount = fileList.length - folderCount;
  
  // 文件选择状态
  const [selectedFiles, setSelectedFiles] = useState<{[key: string]: boolean}>({});
  
  // 自定义文件名状态
  const [customFileName, setCustomFileName] = useState<string>('');
  
  // 确保loading是一个布尔值 - 使用类型断言避免类型错误
  // 这里使用双重否定!!将任何值转换为布尔值
  const isLoading = !!loading;
  
  // 渲染文件图标
  const renderFileIcon = (isFolder: boolean) => {
    return isFolder 
      ? <FolderOutlined className={styles.folderIcon} /> 
      : <FileOutlined className={styles.fileIcon} />;
  };
  
  // 处理文件选择
  const handleFileSelect = (fileId: string, checked: boolean) => {
    setSelectedFiles(prev => ({
      ...prev,
      [fileId]: checked
    }));
  };
  
  // 删除选中文件
  const handleDeleteSelected = () => {
    // 过滤掉被选中的文件
    const updatedFileList = fileList.filter(file => !selectedFiles[file.id]);
    
    // 重置选择状态
    setSelectedFiles({});
    
    // 更新文件列表
    if (onUpdateFileList) {
      onUpdateFileList(updatedFileList);
    }
  };
  
  // 计算是否有文件被选中
  const hasSelectedFiles = Object.values(selectedFiles).some(selected => selected);
  
  // 处理文件名输入变化
  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomFileName(e.target.value);
  };
  
  // 处理下载按钮点击，传递自定义文件名
  const handleDownloadClick = () => {
    // 使用字符串类型传递给onDownload，确保类型安全
    const fileName = customFileName.trim() || '';
    onDownload(fileName);
  };
  
  // 渲染文件列表
  const renderFileList = () => {
    if (fileList.length === 0) {
      return (
        <Alert
          type="warning"
          message="没有选择任何文件或文件夹"
          description="请先选择需要下载的文件或文件夹"
          showIcon
        />
      );
    }
    
    return (
      <List
        className={styles.fileList}
        itemLayout="horizontal"
        dataSource={fileList}
        renderItem={file => (
          <List.Item className={styles.fileItem}>
            <Flex align="center" style={{ width: '100%' }}>
              <Checkbox 
                checked={!!selectedFiles[file.id]}
                onChange={(e) => handleFileSelect(file.id, e.target.checked)}
                className={styles.fileCheckbox}
              />
              <Space className={styles.fileInfo}>
                {renderFileIcon(file.isFolder === true)}
                <Typography.Text ellipsis className={styles.fileName} title={file.name}>
                  {file.name}
                </Typography.Text>
                {file.isFolder && (
                  <Badge 
                    className={styles.folderBadge}
                    count="文件夹" 
                    style={{ backgroundColor: '#faad14', fontSize: '12px' }}
                  />
                )}
              </Space>
            </Flex>
          </List.Item>
        )}
      />
    );
  };
  
  // 生成建议的默认文件名
  const generateDefaultFileName = () => {
    if (fileList.length === 1) {
      // 单个文件，使用文件名
      const fileName = fileList[0].name;
      return fileList[0].isFolder ? `${fileName}.zip` : fileName;
    } else if (fileList.length > 1) {
      // 多个文件，使用"多文件下载.zip"
      return '多文件下载.zip';
    }
    return '';
  };
  
  // 在组件挂载或文件列表变化时更新默认文件名提示
  useEffect(() => {
    if (visible && fileList.length > 0) {
      // 使用生成的默认文件名作为提示
      const defaultName = generateDefaultFileName();
      setCustomFileName(defaultName);
    }
  }, [visible, fileList]);
  
  return (
    <Modal
      title={
        <Flex align="center" gap={8} className={styles.modalTitle}>
          <CloudDownloadOutlined className={styles.titleIcon} />
          <span>文件下载</span>
          {fileList.length > 0 && (
            <Badge 
              count={fileList.length} 
              style={{ 
                backgroundColor: '#4096ff',
                marginLeft: '8px',
                fontWeight: 'normal',
                fontSize: '12px'
              }} 
              overflowCount={999}
            />
          )}
        </Flex>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button 
          key="delete" 
          danger
          icon={<DeleteOutlined />}
          onClick={handleDeleteSelected}
          disabled={!hasSelectedFiles || isLoading}
          className={styles.deleteButton}
        >
          删除选中
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button 
          key="download" 
          type="primary" 
          onClick={handleDownloadClick} 
          loading={isLoading}
          icon={<DownloadOutlined />}
          className={styles.downloadButton}
        >
          开始下载
        </Button>
      ]}
      width={550}
      className={styles.downloadModal}
      maskClosable={false}
    >
      <div className={styles.modalContent}>
        {isLoading ? (
          <Flex vertical align="center" className={styles.loadingContainer}>
            <Spin size="large" />
            <Typography.Paragraph className={styles.loadingText}>
              正在准备下载，请稍候...
            </Typography.Paragraph>
          </Flex>
        ) : (
          <>
            <div className={styles.infoCard}>
              <Typography.Paragraph className={styles.summaryText}>
                <InfoCircleOutlined className={styles.infoIcon} />
                您选择了 <strong>{fileList.length}</strong> 个项目下载
                {folderCount > 0 && fileCount > 0 && (
                  <span>（{folderCount} 个文件夹和 {fileCount} 个文件）</span>
                )}
              </Typography.Paragraph>
              
              <Typography.Paragraph className={styles.zipNote}>
                {folderCount > 0 || fileList.length > 1 ? "文件将被压缩为ZIP格式下载" : ""}
              </Typography.Paragraph>
            </div>
            
            {/* 添加下载文件名设置 */}
            <Flex vertical className={styles.fileNameInputContainer}>
              <Typography.Text strong className={styles.inputLabel}>
                下载文件名称:
              </Typography.Text>
              <Input 
                placeholder="请输入下载文件名称"
                value={customFileName}
                onChange={handleFileNameChange}
                maxLength={100}
                className={styles.fileNameInput}
                suffix={
                  <Tooltip title={folderCount > 0 || fileList.length > 1 
                    ? "多个文件或文件夹将被压缩为ZIP文件" 
                    : "单个文件将保持原始格式"}>
                    <span>{folderCount > 0 || fileList.length > 1 ? ".zip" : ""}</span>
                    <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)', marginLeft: 4 }} />
                  </Tooltip>
                }
              />
            </Flex>
            
            <div className={styles.listContainer}>
              <Flex justify="space-between" align="center" className={styles.listHeader}>
                <Typography.Title level={5} className={styles.listTitle}>
                  下载列表
                </Typography.Title>
                <Typography.Text type="secondary" className={styles.selectTip}>
                  {hasSelectedFiles ? `已选择 ${Object.values(selectedFiles).filter(Boolean).length} 项` : ''}
                </Typography.Text>
              </Flex>
              {renderFileList()}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default DownloadListModal; 