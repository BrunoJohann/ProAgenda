'use client';

import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  useFiliais,
  useMetrics,
  useAppointments,
  useProfessionals,
  useServices,
} from '@proagenda/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@proagenda/ui';
import { Calendar, Users, Briefcase, TrendingUp } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DashboardPage() {
  const { data: filiais } = useFiliais();
  const effectiveFilialId = filiais?.[0]?.id || '';

  // Buscar dados do dia atual
  const today = useMemo(() => new Date(), []);
  const { data: todayMetrics } = useMetrics(effectiveFilialId, {
    from: format(startOfDay(today), 'yyyy-MM-dd'),
    to: format(endOfDay(today), 'yyyy-MM-dd'),
  });

  // Buscar dados da semana atual para comparação
  const { data: weekMetrics } = useMetrics(effectiveFilialId, {
    from: format(startOfWeek(today), 'yyyy-MM-dd'),
    to: format(endOfWeek(today), 'yyyy-MM-dd'),
  });

  // Buscar agendamentos de hoje
  const { data: todayAppointments } = useAppointments({
    filialId: effectiveFilialId,
    from: format(startOfDay(today), "yyyy-MM-dd'T'HH:mm:ss"),
    to: format(endOfDay(today), "yyyy-MM-dd'T'HH:mm:ss"),
    status: 'CONFIRMED',
  });

  // Buscar profissionais e serviços ativos
  const { data: professionals } = useProfessionals(effectiveFilialId);
  const { data: services } = useServices(effectiveFilialId);

  const activeProfessionals = professionals?.filter((p) => p.isActive).length || 0;
  const activeServices = services?.filter((s) => s.isActive).length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral do sistema ProAgenda
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayMetrics?.summary?.totalAppointments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {todayMetrics?.summary?.confirmedAppointments || 0} confirmados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profissionais Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProfessionals}</div>
              <p className="text-xs text-muted-foreground">
                {professionals?.length || 0} cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Serviços</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeServices}</div>
              <p className="text-xs text-muted-foreground">
                {services?.length || 0} cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weekMetrics?.summary?.occupancyRate?.toFixed(1) || '0.0'}%
              </div>
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Próximos Agendamentos</CardTitle>
              <CardDescription>Agendamentos confirmados para hoje</CardDescription>
            </CardHeader>
            <CardContent>
              {!todayAppointments || todayAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum agendamento confirmado para hoje.
                </p>
              ) : (
                <div className="space-y-4">
                  {todayAppointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{appointment.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.services?.[0]?.service?.name || 'Serviço'} -{' '}
                          {format(new Date(appointment.startsAt), 'HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        {appointment.status === 'CONFIRMED'
                          ? 'Confirmado'
                          : appointment.status === 'PENDING'
                          ? 'Pendente'
                          : 'Cancelado'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métricas da Semana</CardTitle>
              <CardDescription>Resumo do desempenho semanal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Total de Agendamentos</p>
                    <p className="text-xs text-muted-foreground">Esta semana</p>
                  </div>
                  <div className="text-2xl font-bold">
                    {weekMetrics?.summary?.totalAppointments || 0}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Taxa de Cancelamento</p>
                    <p className="text-xs text-muted-foreground">Esta semana</p>
                  </div>
                  <div className="text-2xl font-bold">
                    {weekMetrics?.summary?.cancelRate?.toFixed(1) || '0.0'}%
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Receita</p>
                    <p className="text-xs text-muted-foreground">Esta semana</p>
                  </div>
                  <div className="text-xl font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format((weekMetrics?.summary?.revenue || 0) / 100)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

