'use client';

import React from 'react';
import { Progress } from '../ui/progress';

interface StorageUsageProps {
  used: number;
  total: number;
}

function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function StorageUsage({ used, total }: StorageUsageProps) {
  const usedPercent = (used / total) * 100;
  const usedFormatted = formatSize(used);
  const totalFormatted = formatSize(total);
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-600">存储空间</span>
        <span className="text-sm text-gray-600">
          {usedFormatted} / {totalFormatted}
        </span>
      </div>
      <Progress value={usedPercent} className="h-2" />
      {usedPercent > 90 && (
        <p className="mt-2 text-sm text-red-500">
          存储空间即将用完，请及时清理
        </p>
      )}
    </div>
  );
} 