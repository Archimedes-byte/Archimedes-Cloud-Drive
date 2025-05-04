import { ToastProvider } from '@/app/contexts';
import { ToastContainer } from '@/app/components/features/dashboard/toaster/Toaster';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      {children}
      <ToastContainer />
    </ToastProvider>
  );
} 