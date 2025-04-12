'use client';

import React from 'react';
import { Progress } from '@/app/components/ui/progress';
import { Card, Typography, Space } from 'antd';
import { CloudOutlined } from '@ant-design/icons';
import styles from './StorageUsage.module.css';
import { StorageUsageResponse } from '@/app/types/api/responses';
import { formatFileSize } from "@/app/lib/storage";

interface StorageUsageProps {
  usage: StorageUsageResponse['data'];
}

export function StorageUsage({ usage }: StorageUsageProps) {
  const { used, total } = usage;
  const percentage = Math.min(Math.round((used / total) * 100), 100);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1 text-xs text-gray-600">
        <span>已使用存储空间</span>
        <span>{formatFileSize(used)} / {formatFileSize(total)}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
} 