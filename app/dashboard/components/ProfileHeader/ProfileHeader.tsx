import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Session } from 'next-auth';
import { UserInfo } from '@/dashboard/hooks/useProfile';
import { Camera, Upload, Trash2 } from 'lucide-react';
import styles from './ProfileHeader.module.css';

interface ProfileHeaderProps {
  session: Session;
  userInfo: UserInfo;
  onEditClick: () => void;
  onPasswordClick: () => void;
  isLoading: boolean;
  onAvatarChange?: (avatarUrl: string) => void;
}

const ProfileHeader = ({ 
  session, 
  userInfo,
  onEditClick, 
  onPasswordClick, 
  isLoading,
  onAvatarChange
}: ProfileHeaderProps) => {
  const [avatarError, setAvatarError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 使用userInfo中的displayName作为首选，如果没有则使用session中的name
  const displayName = userInfo.displayName || session.user?.name || '未设置昵称';
  
  // 获取用于头像占位符的首字母
  const nameInitial = displayName[0]?.toUpperCase() || '?';

  // 简化头像URL逻辑，直接使用userInfo中的头像或session头像
  const effectiveAvatarUrl = userInfo.avatarUrl || session.user?.image;
  
  // 添加时间戳作为key的一部分，确保每次头像变更都会重新渲染
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const avatarKey = `${effectiveAvatarUrl || 'fallback'}-${refreshKey}`;

  // 添加useEffect监听userInfo.avatarUrl的变化
  useEffect(() => {
    setRefreshKey(Date.now()); // 强制头像重新渲染
    setAvatarError(false); // 重置错误状态
  }, [userInfo.avatarUrl]);

  // 添加深度调试 - 监控props变化
  useEffect(() => {
    console.log('ProfileHeader收到新的userInfo:', 
      { 
        avatarUrl: userInfo.avatarUrl,
        hasAvatar: !!userInfo.avatarUrl,
        displayName: userInfo.displayName
      }
    );
  }, [userInfo]);

  // 打开文件选择器
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // 处理头像上传
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('头像文件选择被触发');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('没有选择文件，上传取消');
      return;
    }

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

    console.log('开始上传文件:', file.name, file.type, file.size);
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      console.log('发送头像上传请求...');
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
        headers: {
          // 添加防缓存头
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      const result = await response.json();
      console.log('服务器返回数据:', result);
      
      if (!response.ok) {
        console.error('服务器返回错误状态码:', response.status);
        const errorMessage = result.error || `服务器错误 (${response.status})`;
        throw new Error(errorMessage);
      }
      
      if (result.success && result.avatarUrl) {
        console.log('头像上传成功，URL:', result.avatarUrl);
        
        // 直接调用回调函数来更新父组件状态
        if (onAvatarChange) {
          console.log('调用onAvatarChange回调更新父组件...');
          onAvatarChange(result.avatarUrl);
          console.log('onAvatarChange回调完成');
        } else {
          console.warn('onAvatarChange回调未提供，无法更新父组件状态');
        }
        
        // 强制刷新
        console.log('更新refreshKey强制刷新视图');
        setRefreshKey(Date.now());
      } else {
        console.error('上传返回错误:', result);
        alert(`上传失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      if (error instanceof Error) {
        alert(`头像上传失败: ${error.message}`);
      } else {
        alert('头像上传失败，请稍后重试');
      }
    } finally {
      setUploading(false);
      console.log('上传状态重置完成');
      // 清空文件输入，以便重新选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        console.log('文件输入已重置');
      }
    }
  };

  // 删除自定义头像
  const handleDeleteAvatar = async () => {
    if (!window.confirm('确定要删除自定义头像吗？')) return;
    
    try {
      setUploading(true);
      
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
        headers: {
          // 添加防缓存头
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
        
        // 调用回调函数更新父组件中的userInfo
        if (onAvatarChange) {
          onAvatarChange('');
        }
        
        // 强制刷新
        setRefreshKey(Date.now());
      } else {
        console.error('删除返回错误:', result);
        alert(`删除失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('删除头像失败:', error);
      alert('删除头像失败，请稍后重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.header}>
      <div className={styles.avatarContainer}>
        <div className={styles.avatar}>
          {effectiveAvatarUrl && !avatarError ? (
            <Image
              key={avatarKey}
              src={`${effectiveAvatarUrl}?t=${refreshKey}`}
              alt="用户头像"
              width={160}
              height={160}
              className={styles.avatarImage}
              priority
              unoptimized={true}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className={styles.avatarFallback}>
              <span>{nameInitial}</span>
            </div>
          )}
          
          {/* 头像上传控件 */}
          <input 
            type="file" 
            ref={fileInputRef}
            className={`${styles.fileInput} avatar-upload-input`} 
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleAvatarChange}
          />
          
          {/* 头像悬停覆盖层 */}
          <div className={styles.avatarOverlay}>
            <button 
              className={styles.avatarButton} 
              onClick={handleAvatarClick}
              disabled={uploading}
              title="上传头像"
            >
              <Camera size={24} />
            </button>
            
            {userInfo.avatarUrl && (
              <button 
                className={styles.avatarButton} 
                onClick={handleDeleteAvatar}
                disabled={uploading}
                title="删除头像"
              >
                <Trash2 size={24} />
              </button>
            )}
          </div>
          
          {uploading && (
            <div className={styles.uploadingOverlay}>
              <div className={styles.spinner}></div>
            </div>
          )}
        </div>
        <p className={styles.avatarHint}>点击更换头像</p>
      </div>
      
      <div className={styles.info}>
        <h1 className={styles.name}>{displayName}</h1>
        <p className={styles.email}>{session.user?.email || '未设置邮箱'}</p>
        <div className={styles.buttons}>
          <button
            onClick={onEditClick}
            className={styles.editButton}
            disabled={isLoading}
          >
            编辑个人信息
          </button>
          <button
            onClick={onPasswordClick}
            className={styles.passwordButton}
            disabled={isLoading}
          >
            设置密码
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader; 