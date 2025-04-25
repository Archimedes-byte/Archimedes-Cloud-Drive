/**
 * 共享组件导出
 * 包含各种可复用的UI元素和功能组件
 */

// 导出共享UI组件
export * from './error-display';
export * from './skeleton';

// 指向样式的重定向导出
// 这些导出帮助现有组件平滑迁移到新的样式结构
export { default as modalStyles } from '../styles/shared/modal-styles.module.css';
export { default as animationStyles } from '../styles/animations/animation.module.css';
export { default as statusStyles } from '../styles/feedback/status.module.css'; 