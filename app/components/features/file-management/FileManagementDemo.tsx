import React, { useState, useCallback } from 'react';
import { Layout } from 'antd';
import MiniSidebar from './navigation/mini-sidebar/MiniSidebar';
import AntSidebar from './navigation/ant-sidebar/AntSidebar';
import styles from '@/app/file-management/styles/shared.module.css';
import { FileType, ViewType, FavoriteFolderInfo } from './navigation/types';

const { Content } = Layout;

// 示例用户数据
const demoUser = {
  avatarUrl: null,
  userName: '测试用户',
  userEmail: 'test@example.com'
};

// 示例收藏夹数据
const demoFavoriteFolders = [
  { 
    id: '1', 
    name: '重要文档', 
    description: '存放重要的工作文档',
    fileCount: 5, 
    isDefault: true,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-05-20'),
    userId: 'user123'
  },
  { 
    id: '2', 
    name: '工作项目', 
    description: '项目相关文件',
    fileCount: 12, 
    isDefault: false,
    createdAt: new Date('2023-02-10'),
    updatedAt: new Date('2023-06-05'),
    userId: 'user123'
  },
  { 
    id: '3', 
    name: '个人收藏', 
    description: null,
    fileCount: 3, 
    isDefault: false,
    createdAt: new Date('2023-03-22'),
    updatedAt: new Date('2023-04-15'),
    userId: 'user123'
  }
];

const FileManagementDemo: React.FC = () => {
  const [selectedFileType, setSelectedFileType] = useState<FileType>(null);
  const [activeView, setActiveView] = useState<string | null>(null);
  
  // 处理各种操作的回调函数
  const handleFileTypeClick = useCallback((type: FileType) => {
    console.log('选中文件类型:', type);
    setSelectedFileType(type);
    setActiveView(null);
  }, []);
  
  const handleSearchClick = useCallback((query?: string) => {
    console.log('搜索:', query);
    setActiveView('search');
  }, []);
  
  const handleSharesClick = useCallback(() => {
    console.log('我的分享');
    setActiveView('shares');
  }, []);
  
  const handleFavoritesClick = useCallback((folderId?: string) => {
    console.log('收藏夹:', folderId);
    setActiveView('favorites');
  }, []);
  
  const handleCreateFavoriteFolder = useCallback(() => {
    console.log('创建新收藏夹');
    // 这里可以添加创建收藏夹的逻辑
  }, []);
  
  const handleRecentClick = useCallback(() => {
    console.log('最近访问');
    setActiveView('recent');
  }, []);
  
  const handleRecentDownloadsClick = useCallback(() => {
    console.log('最近下载');
    setActiveView('downloads');
  }, []);
  
  const handleHomeClick = useCallback(() => {
    console.log('返回首页');
  }, []);
  
  const handleLogoutClick = useCallback(() => {
    console.log('退出登录');
  }, []);
  
  const handleAvatarClick = useCallback(() => {
    console.log('点击用户头像');
  }, []);
  
  const handleThemeClick = useCallback(() => {
    console.log('主题设置');
  }, []);

  return (
    <Layout style={{ height: '100vh' }}>
      <MiniSidebar
        avatarUrl={demoUser.avatarUrl}
        userName={demoUser.userName}
        userEmail={demoUser.userEmail}
        onHomeClick={handleHomeClick}
        onLogoutClick={handleLogoutClick}
        onAvatarClick={handleAvatarClick}
        onThemeClick={handleThemeClick}
      />
      
      <Layout>
        {/* 新的基于Ant Design的侧边栏 */}
        <AntSidebar
          selectedFileType={selectedFileType}
          onTypeClick={handleFileTypeClick}
          onSearchClick={handleSearchClick}
          onSharesClick={handleSharesClick}
          onFavoritesClick={handleFavoritesClick}
          onCreateFavoriteFolder={handleCreateFavoriteFolder}
          onRecentClick={handleRecentClick}
          onRecentDownloadsClick={handleRecentDownloadsClick}
          activeView={activeView as any}
          favoriteFolders={demoFavoriteFolders}
        />
        
        <Content className={styles.mainContent}>
          <div className={styles.contentHeader}>
            <h1>文件管理系统</h1>
            <p>这是一个使用Ant Design组件改造的侧边栏示例</p>
          </div>
          
          <div className={styles.contentBody}>
            <h2>当前视图: {activeView || selectedFileType || '全部文件'}</h2>
            <p>点击侧边栏中的选项来切换不同的视图</p>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default FileManagementDemo; 