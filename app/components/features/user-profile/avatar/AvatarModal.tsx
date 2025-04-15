'use client';

import React, { useState, useRef, useEffect, DragEvent } from 'react';
import Image from 'next/image';
import { Camera, Upload, Trash2, X, ArrowLeft, FolderUp } from 'lucide-react';
import styles from './AvatarCropper.module.css';
import AvatarCropper from './AvatarCropper';

// 定义可能的视图状态
const VIEWS = {
  MAIN: 'main',       // 主视图 - 显示当前头像和操作按钮
  SELECT: 'select',   // 选择图片视图
  CROP: 'crop'        // 裁剪视图
};

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  userDisplayName?: string;
  onAvatarChange: (avatarUrl: string) => void;
}

const AvatarModal: React.FC<AvatarModalProps> = ({ 
  isOpen, 
  onClose, 
  currentAvatarUrl, 
  userDisplayName = '', 
  onAvatarChange 
}) => {
  const [currentView, setCurrentView] = useState(VIEWS.MAIN);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 获取用于头像占位符的首字母
  const nameInitial = userDisplayName[0]?.toUpperCase() || '?';

  // 重置视图和状态
  useEffect(() => {
    if (!isOpen) {
      setCurrentView(VIEWS.MAIN);
      setSelectedFile(null);
      setUploading(false);
    }
  }, [isOpen]);

  // 打开文件选择器
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('不支持的文件类型，请上传JPEG、PNG、GIF或WEBP图片');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    // 检查文件大小
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      alert('文件大小超过限制（最大2MB）');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setCurrentView(VIEWS.CROP);
  };

  // 处理头像上传
  const handleCropComplete = async (croppedImage: Blob) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      // 将Blob转换为File对象，保留原始文件的类型
      const fileName = selectedFile ? selectedFile.name : 'avatar.jpg';
      const fileType = selectedFile ? selectedFile.type : 'image/jpeg';
      const file = new File([croppedImage], fileName, { type: fileType });
      formData.append('avatar', file);
      
      console.log('发送头像上传请求...');
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `服务器错误 (${response.status})`);
      }
      
      if (result.success && result.avatarUrl) {
        console.log('头像上传成功，URL:', result.avatarUrl);
        onAvatarChange(result.avatarUrl);
        onClose(); // 成功后关闭弹窗
      } else {
        throw new Error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      alert(`头像上传失败: ${error instanceof Error ? error.message : '请稍后重试'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 处理删除头像
  const handleDeleteAvatar = async () => {
    if (!currentAvatarUrl) return;
    if (!window.confirm('确定要删除当前头像吗？')) return;
    
    try {
      setUploading(true);
      
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('头像删除成功');
        onAvatarChange('');
        alert('头像已成功删除');
        onClose(); // 成功后关闭弹窗
      } else {
        throw new Error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除头像失败:', error);
      alert('删除头像失败，请稍后重试');
    } finally {
      setUploading(false);
    }
  };

  // 处理拖拽进入
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // 处理拖拽释放
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // 验证文件类型
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('不支持的文件类型，请上传JPEG、PNG、GIF或WEBP图片');
        return;
      }
      
      // 验证文件大小
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        alert('文件大小超过限制（最大2MB）');
        return;
      }
      
      setSelectedFile(file);
      setCurrentView(VIEWS.CROP);
    }
  };

  // 如果弹窗未打开，不渲染内容
  if (!isOpen) return null;

  // 处理点击关闭弹窗的背景区域
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      // 如果正在上传或者在裁剪状态，不允许通过点击背景关闭
      if (!uploading && currentView !== VIEWS.CROP) {
        onClose();
      }
    }
  };

  // 渲染主视图 - 显示当前头像和操作按钮
  const renderMainView = () => (
    <div className={styles.avatarModal}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>管理头像</h2>
        <button className={styles.closeButton} onClick={onClose} disabled={uploading}>
          <X size={24} />
        </button>
      </div>

      <div className={styles.avatarPreview}>
        {currentAvatarUrl ? (
          <img 
            className={styles.currentAvatar}
            src={currentAvatarUrl}
            alt="当前头像"
          />
        ) : (
          <div className={styles.avatarFallback}>
            <span>{nameInitial}</span>
          </div>
        )}
      </div>

      <div className={styles.actionButtons}>
        <button 
          className={styles.uploadButton}
          onClick={() => setCurrentView(VIEWS.SELECT)}
          disabled={uploading}
        >
          <Upload size={18} />
          上传新头像
        </button>
        {currentAvatarUrl && (
          <button 
            className={styles.deleteButton}
            onClick={handleDeleteAvatar}
            disabled={uploading}
          >
            <Trash2 size={18} />
            删除当前头像
          </button>
        )}
      </div>

      <div className={styles.modalFooter}>
        <button 
          className={styles.closeModalButton}
          onClick={onClose}
          disabled={uploading}
        >
          关闭
        </button>
      </div>
    </div>
  );

  // 渲染选择图片视图
  const renderSelectView = () => (
    <div className={styles.avatarModal}>
      <div className={styles.modalHeader}>
        <button 
          className={styles.backButton}
          onClick={() => setCurrentView(VIEWS.MAIN)}
          disabled={uploading}
        >
          <ArrowLeft size={16} />
          返回
        </button>
        <button className={styles.closeButton} onClick={onClose} disabled={uploading}>
          <X size={24} />
        </button>
      </div>

      <h2 className={styles.modalTitle}>选择图片</h2>
      
      <div 
        className={styles.dropArea}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <FolderUp size={48} color="#2563eb" />
        <p>拖放图片文件到这里，或点击下方按钮选择</p>
      </div>

      <div className={styles.fileInputContainer}>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />
        <button 
          className={styles.browseButton}
          onClick={openFileSelector}
          disabled={uploading}
        >
          <Upload size={18} />
          浏览文件
        </button>
      </div>

      <div className={styles.modalFooter}>
        <button 
          className={styles.closeModalButton}
          onClick={() => setCurrentView(VIEWS.MAIN)}
          disabled={uploading}
        >
          取消
        </button>
      </div>
    </div>
  );

  // 渲染裁剪视图
  const renderCropView = () => (
    <div className={styles.avatarModal} style={{ padding: 0, overflow: 'visible' }}>
      {selectedFile && (
        <AvatarCropper 
          image={selectedFile} 
          onClose={() => {
            setCurrentView(VIEWS.SELECT);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          onCropComplete={handleCropComplete}
          inModal={true}
        />
      )}
    </div>
  );

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      {currentView === VIEWS.MAIN && renderMainView()}
      {currentView === VIEWS.SELECT && renderSelectView()}
      {currentView === VIEWS.CROP && renderCropView()}
    </div>
  );
};

export default AvatarModal; 