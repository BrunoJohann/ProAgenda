'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCustomerAuthStore } from '@/lib/store/customer-auth-store';
import { CustomerSidebar } from '@/components/layout/customer-sidebar';

export default function MeusAgendamentosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;
  const { isAuthenticated } = useCustomerAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${tenant}/login`);
    }
  }, [isAuthenticated, router, tenant]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <CustomerSidebar tenant={tenant} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}


