'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <div className="flex min-h-screen flex-col">
      {!isLoginPage && <Header />}
      <main className="flex-1">{children}</main>
      {!isLoginPage && <Footer />}
    </div>
  );
}


