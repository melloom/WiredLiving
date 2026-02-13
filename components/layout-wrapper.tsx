'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <div className="flex min-h-screen flex-col">
      {!isLoginPage && !isAdminPage && <Header />}
      <main className="flex-1">{children}</main>
      {!isLoginPage && !isAdminPage && <Footer />}
    </div>
  );
}


