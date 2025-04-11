'use client';

import React from 'react';
import { Progress } from '../ui/progress';
import { CloudOutlined } from '@ant-design/icons';
import { StorageUsageInfo } from '@/app/types';
import { formatFileSize } from "@/app/lib/file/utils";

interface StorageUsageProps {
  usage: StorageUsageInfo;
  showWarning?: boolean;
  className?: string;
  compact?: boolean;
}

export function StorageUsage({ 
  usage, 
  showWarning = true,
  className = '',
  compact = false
}: StorageUsageProps) {
  const { used, total } = usage;
  const percentage = Math.min(Math.round((used / total) * 100), 100);
  const usedFormatted = formatFileSize(used);
  const totalFormatted = formatFileSize(total);
  
  // 确定存储状态的颜色
  const getProgressColor = () => {
    if (percentage > 90) return "bg-red-500";
    if (percentage > 70) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  if (compact) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex justify-between mb-1 text-xs text-gray-600">
          <span>存储空间</span>
          <span>{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-1.5" />
      </div>
    );
  }
  
  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      <div className="flex items-center mb-2">
        <CloudOutlined className="mr-2 text-blue-500" />
        <span className="text-sm font-medium">云存储空间</span>
      </div>
      
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-600">已用空间</span>
        <span className="text-sm text-gray-600">
          {usedFormatted} / {totalFormatted}
        </span>
      </div>
      
      <Progress value={percentage} className="h-2" />
      
      {showWarning && percentage > 90 && (
        <p className="mt-2 text-xs text-red-500">
          存储空间即将用完，请及时清理或升级套餐
        </p>
      )}
    </div>
  );
} 