/**
 * 格式化工具函数集中导出
 * 
 * 提供常用的格式化功能
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并CSS类名工具函数
 * 结合clsx和tailwind-merge实现条件类名和冲突解决
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化货币显示
 * @param amount 金额
 * @param currency 货币代码，默认为CNY
 * @returns 格式化的货币字符串
 */
export const formatCurrency = (amount: number, currency: string = 'CNY'): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * 格式化数字，添加千位分隔符
 * @param num 要格式化的数字
 * @returns 格式化后的字符串
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('zh-CN').format(num);
};

/**
 * 将字符串首字母大写
 * @param str 输入字符串
 * @returns 首字母大写的字符串
 */
export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * 截断文本并添加省略号
 * @param text 要截断的文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}; 