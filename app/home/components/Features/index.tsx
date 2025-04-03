'use client';

import React from 'react';
import { ShieldCheck, Zap, Smartphone, CloudUpload, Share2, Server } from 'lucide-react';
import styles from './Features.module.css';

// 定义特性数据
const featureData = [
  {
    icon: ShieldCheck,
    title: '安全存储',
    description: '采用先进的加密技术，保护您的数据安全，确保隐私不被泄露'
  },
  {
    icon: Zap,
    title: '高速传输',
    description: '优化的传输算法，让您的文件传输更快，支持大文件传输'
  },
  {
    icon: Smartphone,
    title: '随时访问',
    description: '多设备支持，让您随时随地管理文件，跨平台无缝同步'
  },
  {
    icon: CloudUpload,
    title: '轻松上传',
    description: '拖拽上传，自动分类，提供便捷高效的文件管理体验'
  },
  {
    icon: Share2,
    title: '便捷分享',
    description: '一键生成分享链接，设置密码和过期时间，轻松共享文件'
  },
  {
    icon: Server,
    title: '数据备份',
    description: '自动云端备份，多重存储保障，让您的重要数据永不丢失'
  }
];

const Features: React.FC<{id?: string}> = ({ id }) => {
  return (
    <div className={styles.featuresWrapper} id={id}>
      <h3 className={styles.featuresTitle}>全方位云存储体验</h3>
      <div className={styles.featuresSection}>
        {featureData.map((feature, index) => (
          <div className={styles.featureCard} key={index}>
            <div className={styles.featureIcon}>
              <feature.icon size={42} />
            </div>
            <h4>{feature.title}</h4>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features; 