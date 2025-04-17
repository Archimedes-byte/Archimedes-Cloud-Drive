// 导入调试工具（仅在开发环境中）
import '@/app/utils/debug';

// 布局组件定义
export default function FileManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {children}
    </div>
  );
} 