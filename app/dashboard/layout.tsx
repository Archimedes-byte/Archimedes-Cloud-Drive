import { ToastProvider } from './components/Toaster';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
} 