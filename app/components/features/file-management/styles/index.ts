// 样式模块集中导出文件
// 此文件集中导出所有文件管理相关的样式模块

// 布局相关样式
export { default as layoutStyles } from './layout/layout.module.css';
export { default as pageLayoutStyles } from './layout/page-layout.module.css';
// 注意：ant-layout.css 被直接导入而不是导出，因为它是全局CSS

// 共享UI组件样式
export { default as sharedStyles } from './shared/shared.module.css';
// 模态框样式已移至shared目录，从那里导出
export { modalStyles } from '../shared';

// 动画样式
export { default as animationStyles } from './animations/animation.module.css';

// 状态和反馈样式
export { default as statusStyles } from './feedback/status.module.css'; 