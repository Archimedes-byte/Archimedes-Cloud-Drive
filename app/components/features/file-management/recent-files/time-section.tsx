'use client';

import React from 'react';
import { Divider } from 'antd';
import { FileInfo } from '@/app/types';

interface TimeSectionProps {
  title: string;
  files: FileInfo[];
  selectedFiles: string[];
  favoritedFileIds: string[];
  fileUpdateTrigger: number;
  FileListComponent: React.ReactNode;
}

/**
 * 时间分段组件
 * 用于按照时间段分组显示文件列表，如"今天"、"昨天"、"过去一周"等
 */
export const TimeSection: React.FC<TimeSectionProps> = ({
  title,
  files,
  selectedFiles,
  favoritedFileIds,
  fileUpdateTrigger,
  FileListComponent
}) => {
  return (
    <div className="time-section">
      <div className="time-section-header">
        <h3 className="time-section-title">{title}</h3>
        <div className="time-section-subtitle">
          {files.length} {files.length > 1 ? '个文件' : '个文件'}
        </div>
      </div>
      
      {FileListComponent}
      
      <Divider style={{ margin: '24px 0' }} />
      
      <style jsx>{`
        .time-section {
          margin-bottom: 24px;
        }
        
        .time-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .time-section-title {
          font-size: 16px;
          font-weight: 600;
          color: #4a5568;
          margin: 0;
        }
        
        .time-section-subtitle {
          font-size: 14px;
          color: #718096;
        }
      `}</style>
    </div>
  );
}; 