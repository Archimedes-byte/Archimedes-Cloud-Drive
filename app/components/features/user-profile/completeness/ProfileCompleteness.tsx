import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { UserProfile } from '@/app/hooks/user/useProfile';
import styles from './ProfileCompleteness.module.css';
import { 
  ExclamationCircleOutlined, CheckCircleOutlined, UserOutlined, 
  FileTextOutlined, EnvironmentOutlined, GlobalOutlined, 
  BankOutlined, PictureOutlined 
} from '@ant-design/icons';

interface ProfileCompletenessProps {
  userProfile: UserProfile;
  onEditClick?: () => void; // 添加打开编辑模态框的回调
  onAvatarClick?: () => void; // 添加上传头像的回调
}

interface CheckItem {
  id: string;
  label: string;
  check: (userProfile: UserProfile) => boolean;
  importance: number; // 1-5，表示这个项目对资料完整度的重要性
  icon: React.ReactNode;
  description: string; // 添加建议描述
  field: string; // 对应的字段名
}

const ProfileCompleteness: React.FC<ProfileCompletenessProps> = ({ 
  userProfile, 
  onEditClick, 
  onAvatarClick 
}) => {
  const [completenessPercentage, setCompletenessPercentage] = useState(0);
  const [animation, setAnimation] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // 使用useMemo定义要检查的个人资料项目，避免不必要的重新创建
  const checkItems: CheckItem[] = useMemo(() => [
    {
      id: 'displayName',
      label: '设置显示名称',
      check: (profile) => !!profile.name,
      importance: 5,
      icon: <UserOutlined />,
      description: '有个好名字让大家更容易记住你',
      field: 'name'
    },
    {
      id: 'bio',
      label: '填写个人简介',
      check: (profile) => !!profile.bio, // 修改为只要有内容就算完成
      importance: 4,
      icon: <FileTextOutlined />,
      description: '简单介绍一下自己，让别人了解你的兴趣和专长',
      field: 'bio'
    },
    {
      id: 'avatar',
      label: '上传个人头像',
      check: (profile) => {
        const hasAvatar = !!profile.avatarUrl && profile.avatarUrl.trim() !== '';
        console.log('检查头像完整度:', profile.avatarUrl, hasAvatar);
        return hasAvatar;
      },
      importance: 4,
      icon: <PictureOutlined />,
      description: '一个个性化的头像能让你的档案更加生动',
      field: 'avatar'
    },
    {
      id: 'location',
      label: '添加所在地',
      check: (profile) => !!profile.location,
      importance: 3,
      icon: <EnvironmentOutlined />,
      description: '分享你的位置有助于找到附近的合作伙伴',
      field: 'location'
    },
    {
      id: 'website',
      label: '添加个人网站',
      check: (profile) => !!profile.website,
      importance: 2,
      icon: <GlobalOutlined />,
      description: '展示你的个人网站或社交媒体链接',
      field: 'website'
    },
    {
      id: 'company',
      label: '添加公司/组织',
      check: (profile) => !!profile.company,
      importance: 3,
      icon: <BankOutlined />,
      description: '分享你所在的公司或组织信息',
      field: 'company'
    }
  ], []);

  // 在userProfile变化时强制刷新
  useEffect(() => {
    setRefreshTrigger(prev => prev + 1);
    console.log('用户信息变更，触发完整度重新计算', userProfile);
  }, [userProfile]);

  // 使用useCallback创建记忆化的计算函数
  const calculateCompleteness = useCallback(() => {
    // 确保每次userProfile变更时都重新计算
    const completedItems = checkItems.filter(item => item.check(userProfile));
    const totalWeight = checkItems.reduce((sum, item) => sum + item.importance, 0);
    const completedWeight = completedItems.reduce((sum, item) => sum + item.importance, 0);
    
    // 计算完整度百分比
    const newPercentage = Math.round((completedWeight / totalWeight) * 100);
    
    console.log('完整度计算:', {
      completed: completedItems.map(i => i.id),
      incomplete: checkItems.filter(item => !item.check(userProfile)).map(i => i.id),
      percentage: newPercentage
    });
    
    return newPercentage;
  }, [userProfile, checkItems]);

  // 计算完成的项目和总权重
  useEffect(() => {
    const newPercentage = calculateCompleteness();
    
    // 如果百分比有变化，触发动画效果
    if (newPercentage !== completenessPercentage) {
      setAnimation(true);
      const timer1 = setTimeout(() => {
        setCompletenessPercentage(newPercentage);
        const timer2 = setTimeout(() => setAnimation(false), 500);
        return () => clearTimeout(timer2);
      }, 100);
      return () => clearTimeout(timer1);
    }
  }, [userProfile, calculateCompleteness, completenessPercentage, refreshTrigger]);

  // 按重要性排序未完成的项目 - 使用useMemo优化
  const incompleteItems = useMemo(() => checkItems
    .filter(item => !item.check(userProfile))
    .sort((a, b) => b.importance - a.importance), 
    [checkItems, userProfile]
  );

  // 已完成的项目数量 - 直接计算避免额外状态
  const completedCount = checkItems.length - incompleteItems.length;

  // 处理建议项点击事件
  const handleSuggestionClick = useCallback((itemId: string) => {
    if (itemId === 'avatar' && onAvatarClick) {
      onAvatarClick();
    } else if (onEditClick) {
      onEditClick();
    }
  }, [onAvatarClick, onEditClick]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        个人资料完整度
        {completedCount === checkItems.length && (
          <span className={styles.completeIcon}><CheckCircleOutlined style={{ fontSize: 18 }} /></span>
        )}
      </h2>
      
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div 
            className={`${styles.progressFill} ${animation ? styles.animate : ''}`} 
            style={{ width: `${completenessPercentage}%` }}
          />
        </div>
        <span className={`${styles.percentage} ${animation ? styles.pulse : ''}`}>{completenessPercentage}%</span>
      </div>
      
      {incompleteItems.length > 0 && (
        <div className={styles.suggestionsContainer}>
          <div className={styles.suggestionsHeader}>
            <ExclamationCircleOutlined style={{ fontSize: 16 }} />
            <span>完善以下信息以提高资料完整度：</span>
          </div>
          <ul className={styles.suggestionsList}>
            {incompleteItems.map(item => (
              <li 
                key={item.id} 
                className={styles.suggestionItem} 
                onClick={() => handleSuggestionClick(item.id)}
                role="button"
                tabIndex={0}
                aria-label={`填写${item.label}`}
              >
                <span className={styles.suggestionIcon}>{item.icon}</span>
                <div className={styles.suggestionContent}>
                  <strong>{item.label}</strong>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {incompleteItems.length === 0 && (
        <div className={styles.completedMessage}>
          <CheckCircleOutlined style={{ fontSize: 20 }} />
          <span>太棒了！您的个人资料已经完善。</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(ProfileCompleteness); 