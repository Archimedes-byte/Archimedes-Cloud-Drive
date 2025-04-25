'use client';

import React, { ReactNode } from 'react';
import { Layout, theme } from 'antd';
import { themeTokens } from '@/app/theme';
import '../styles/layout/ant-layout.css';

const { Header, Sider, Content } = Layout;

interface AntLayoutProps {
  header?: ReactNode;
  sider?: ReactNode;
  content: ReactNode;
  hasSider?: boolean;
  headerHeight?: number;
  siderWidth?: number;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  siderClassName?: string;
}

/**
 * 基于Ant Design的布局组件，替代原有的手写布局
 */
export function AntLayout({
  header,
  sider,
  content,
  hasSider = true,
  headerHeight = 64,
  siderWidth = 240,
  className,
  contentClassName,
  headerClassName,
  siderClassName,
}: AntLayoutProps) {
  // 使用Ant Design提供的主题变量
  const { token } = theme.useToken();

  return (
    <Layout className={`ant-custom-layout ${className || ''}`}>
      {header && (
        <Header 
          className={`ant-custom-header ${headerClassName || ''}`}
          style={{ height: headerHeight }}
        >
          {header}
        </Header>
      )}
      
      <Layout>
        {hasSider && sider && (
          <Sider
            width={siderWidth}
            className={`ant-custom-sider ${siderClassName || ''}`}
            theme="light"
          >
            {sider}
          </Sider>
        )}
        
        <Content className={`ant-custom-content ${contentClassName || ''}`}>
          {content}
        </Content>
      </Layout>
    </Layout>
  );
}

export default AntLayout; 