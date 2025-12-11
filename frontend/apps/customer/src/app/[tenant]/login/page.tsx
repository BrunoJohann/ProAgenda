'use client';

import { MagicLinkForm } from '@/components/auth/magic-link-form';
import { useParams } from 'next/navigation';

export default function LoginPage() {
  const params = useParams();
  const tenant = params.tenant as string;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">ProAgenda</h1>
          <p className="mt-2 text-gray-600">Portal do Cliente</p>
        </div>
        <MagicLinkForm tenant={tenant} />
      </div>
    </div>
  );
}






