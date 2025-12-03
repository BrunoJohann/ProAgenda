'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCustomerAuthStore } from '@/lib/store/customer-auth-store';

export default function AgendarPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;
  const { isAuthenticated } = useCustomerAuthStore();

  useEffect(() => {
    // Redirect to booking app for public appointments
    // Booking app runs on port 3003
    const bookingUrl = `http://localhost:3003/${tenant}/agendar`;
    window.location.href = bookingUrl;
  }, [tenant]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecionando para agendamento...</p>
      </div>
    </div>
  );
}

