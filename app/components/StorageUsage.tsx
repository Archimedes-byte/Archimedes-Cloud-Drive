'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';

interface StorageUsageProps {
  used: number;
  total: number;
}

export function StorageUsage({ used, total }: StorageUsageProps) {
  const percentage = Math.round((used / total) * 100);
  const usedGB = (used / 1024 / 1024).toFixed(2);
  const totalGB = (total / 1024 / 1024).toFixed(2);

  return (
    <div className="storage-usage">
      <div className="flex justify-between mb-2">
        <span>存储空间</span>
        <span>{usedGB}GB / {totalGB}GB</span>
      </div>
      <Progress value={percentage} className="w-full" />
    </div>
  );
} 