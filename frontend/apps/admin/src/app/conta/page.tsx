'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuthStore } from '@/lib/store/auth-store';
import { useMe, useUpdateMe } from '@proagenda/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@proagenda/ui';
import { UserForm } from '@/components/conta/user-form';
import { Skeleton } from '@proagenda/ui';

export default function ContaPage() {
  const { user } = useAuthStore();
  const { data: userData, isLoading } = useMe();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Minha Conta</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas informações pessoais
            </p>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Minha Conta</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>

        {/* Formulário de Edição */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize suas informações de perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserForm user={userData} />
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>
              Detalhes sobre sua conta no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-muted-foreground">Email</span>
                <span className="text-sm">{userData?.email || user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-muted-foreground">ID do Usuário</span>
                <span className="text-sm font-mono text-xs">{userData?.id || user?.id}</span>
              </div>
              {userData?.roles && userData.roles.length > 0 && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground">Permissões</span>
                  <div className="flex flex-wrap gap-2">
                    {userData.roles.map((role: any) => (
                      <span
                        key={role.id}
                        className="text-xs px-2 py-1 bg-secondary rounded-md"
                      >
                        {role.role}
                        {role.filial && ` - ${role.filial.name}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}







