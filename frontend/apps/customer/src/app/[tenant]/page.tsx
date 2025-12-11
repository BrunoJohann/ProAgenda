'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCustomerAuthStore } from '@/lib/store/customer-auth-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@proagenda/ui';
import { Calendar, LogIn, User } from 'lucide-react';

export default function TenantHomePage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;
  const { isAuthenticated } = useCustomerAuthStore();

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(`/${tenant}/meus-agendamentos`);
    }
  }, [isAuthenticated, router, tenant]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">ProAgenda</h1>
          <p className="mt-2 text-gray-600">Portal do Cliente</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = `http://localhost:3003/${tenant}/agendar`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Agendar Serviço
              </CardTitle>
              <CardDescription>
                Agende um novo serviço sem precisar fazer login
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="default">
                Agendar Agora
              </Button>
            </CardContent>
          </Card>

          {isAuthenticated ? (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push(`/${tenant}/meus-agendamentos`)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Meus Agendamentos
                </CardTitle>
                <CardDescription>
                  Veja seus agendamentos futuros e histórico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Acessar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push(`/${tenant}/login`)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Fazer Login
                </CardTitle>
                <CardDescription>
                  Acesse sua conta para ver seus agendamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Entrar
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

