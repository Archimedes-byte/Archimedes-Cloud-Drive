/**
 * 共享组件导出
 * 包含各种可复用的UI元素和功能组件
 */

// 导出shared下的通用组件和样式

// 从当前目录导出模态框样式，不再引用styles/shared目录
export { default as modalStyles } from './modal-styles.module.css';

// 导出其他组件
export * from './error-display';
export * from './skeleton';

// 指向样式的重定向导出
// 这些导出帮助现有组件平滑迁移到新的样式结构
export { default as animationStyles } from '../styles/animations/animation.module.css';
export { default as statusStyles } from '../styles/feedback/status.module.css'; 