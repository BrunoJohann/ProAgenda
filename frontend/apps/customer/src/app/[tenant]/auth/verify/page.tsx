'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { customerAuthApi } from '@proagenda/api-client';
import { useCustomerAuthStore } from '@/lib/store/customer-auth-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@proagenda/ui';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyMagicLinkPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenant = params.tenant as string;
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const { setAuth } = useCustomerAuthStore();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      toast.error('Token inválido');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await customerAuthApi.verifyMagicLink(token, tenant);
        
        // Set auth state
        setAuth(
          response.data.user,
          response.data.accessToken,
          response.data.refreshToken
        );

        // Set tokens in API client
        const { getApiClient } = await import('@proagenda/api-client');
        const apiClient = getApiClient();
        apiClient.setTokens(response.data.accessToken, response.data.refreshToken);

        setStatus('success');
        toast.success('Login realizado com sucesso!');

        // Redirect to dashboard after 1 second
        setTimeout(() => {
          router.push(`/${tenant}/meus-agendamentos`);
        }, 1000);
      } catch (error: any) {
        setStatus('error');
        toast.error(error.response?.data?.message || 'Link inválido ou expirado');
      }
    };

    verifyToken();
  }, [token, tenant, setAuth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
              {status === 'loading' && 'Verificando...'}
              {status === 'success' && 'Login Realizado!'}
              {status === 'error' && 'Erro ao Verificar'}
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Aguarde enquanto verificamos seu link de acesso...'}
              {status === 'success' && 'Redirecionando para sua área...'}
              {status === 'error' && 'O link de acesso é inválido ou expirou. Tente fazer login novamente.'}
            </CardDescription>
          </CardHeader>
          {status === 'error' && (
            <CardContent>
              <a
                href={`/${tenant}/login`}
                className="text-primary hover:underline text-sm"
              >
                Voltar para login
              </a>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}


