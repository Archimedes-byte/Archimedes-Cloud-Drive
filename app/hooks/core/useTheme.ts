/**
 * 主题Hook
 * 
 * 注意: 此文件是为了向后兼容而保留的，实际实现已移动到 app/theme/useTheme.ts
 */

import { useTheme as useThemeImpl } from '@/app/theme/useTheme';

export { useTheme } from '@/app/theme/useTheme';
export default useThemeImpl; 