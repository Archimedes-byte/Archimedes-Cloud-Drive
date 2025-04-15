import { ToastProvider } from '@/app/components/features/dashboard/Toaster';

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