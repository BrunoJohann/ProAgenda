'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useFiliais, useMetrics } from '@proagenda/api-client';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@proagenda/ui';
import { Download, Calendar } from 'lucide-react';
import { MetricsSummaryCards } from '@/components/metricas/metrics-summary';
import { AppointmentsChart } from '@/components/metricas/appointments-chart';
import { ServiceMixChart } from '@/components/metricas/service-mix-chart';
import { Heatmap } from '@/components/metricas/heatmap';
import { FiltersBar } from '@/components/common/filters-bar';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import type { Metrics, Filial, ServiceMixItem } from '@proagenda/api-client';

type PeriodType = '7d' | '30d' | 'week' | 'month' | 'custom';

export default function MetricasPage() {
  const { data: filiais } = useFiliais();
  const [selectedFilialId, setSelectedFilialId] = useState<string>('');
  const [periodType, setPeriodType] = useState<PeriodType>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const effectiveFilialId = selectedFilialId || filiais?.[0]?.id || '';

  // Calcular datas com base no período
  const { from, to } = useMemo(() => {
    const today = new Date();
    
    switch (periodType) {
      case '7d':
        return {
          from: format(subDays(today, 7), 'yyyy-MM-dd'),
          to: format(today, 'yyyy-MM-dd'),
        };
      case '30d':
        return {
          from: format(subDays(today, 30), 'yyyy-MM-dd'),
          to: format(today, 'yyyy-MM-dd'),
        };
      case 'week':
        return {
          from: format(startOfWeek(today), 'yyyy-MM-dd'),
          to: format(endOfWeek(today), 'yyyy-MM-dd'),
        };
      case 'month':
        return {
          from: format(startOfMonth(today), 'yyyy-MM-dd'),
          to: format(endOfMonth(today), 'yyyy-MM-dd'),
        };
      case 'custom':
        return {
          from: customFrom || format(subDays(today, 30), 'yyyy-MM-dd'),
          to: customTo || format(today, 'yyyy-MM-dd'),
        };
      default:
        return {
          from: format(subDays(today, 30), 'yyyy-MM-dd'),
          to: format(today, 'yyyy-MM-dd'),
        };
    }
  }, [periodType, customFrom, customTo]);

  // Buscar métricas da API
  const { data: metrics, isLoading, error } = useMetrics(effectiveFilialId, { from, to });

  const handleExportPDF = () => {
    // TODO: Implementar exportação para PDF
    alert('Exportação para PDF ainda não implementada');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Métricas e Relatórios</h1>
            <p className="text-muted-foreground mt-2">
              Análise detalhada do desempenho do negócio
            </p>
          </div>
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

        {/* Filtros */}
        <FiltersBar
          filters={[
            {
              id: 'filial',
              label: 'Filial',
              component: (
                <select
                  className="w-full h-9 px-3 rounded-md border border-input bg-background"
                  value={selectedFilialId}
                  onChange={(e) => setSelectedFilialId(e.target.value)}
                >
                  {filiais?.map((filial: Filial) => (
                    <option key={filial.id} value={filial.id}>
                      {filial.name}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              id: 'period',
              label: 'Período',
              component: (
                <select
                  className="w-full h-9 px-3 rounded-md border border-input bg-background"
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value as PeriodType)}
                >
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mês</option>
                  <option value="custom">Período personalizado</option>
                </select>
              ),
            },
            ...(periodType === 'custom'
              ? [
                  {
                    id: 'from',
                    label: 'De',
                    component: (
                      <input
                        type="date"
                        className="w-full h-9 px-3 rounded-md border border-input bg-background"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                      />
                    ),
                  },
                  {
                    id: 'to',
                    label: 'Até',
                    component: (
                      <input
                        type="date"
                        className="w-full h-9 px-3 rounded-md border border-input bg-background"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                      />
                    ),
                  },
                ]
              : []),
          ]}
          showClearButton={false}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando métricas...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground py-8">
                <p className="text-lg font-semibold">Erro ao carregar métricas</p>
                <p className="mt-2">Por favor, tente novamente mais tarde.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Display */}
        {metrics && !isLoading && (
          <div className="space-y-6">
            {/* Cards de Resumo */}
            <MetricsSummaryCards summary={metrics.summary} />

            {/* Gráficos */}
            <div className="grid gap-6 md:grid-cols-2">
              <AppointmentsChart data={metrics.timeseries || []} />
              <ServiceMixChart data={metrics.serviceMix || []} />
            </div>

            {/* Heatmap */}
            <Heatmap data={metrics.heatmap || []} />

            {/* Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Indicadores de Performance</CardTitle>
                <CardDescription>Métricas operacionais do período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Duração Média dos Serviços
                    </div>
                    <div className="text-2xl font-bold">
                      {metrics?.performance?.avgDurationMinutes} min
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Buffer Médio
                    </div>
                    <div className="text-2xl font-bold">
                      {metrics?.performance?.avgBufferMinutes} min
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Horários de Pico
                    </div>
                    <div className="text-2xl font-bold">
                      {metrics?.performance?.peakHours?.join('h, ')}h
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Serviços */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Serviço</CardTitle>
                <CardDescription>Performance individual de cada serviço</CardDescription>
              </CardHeader>
              <CardContent>
                {!metrics.serviceMix || metrics.serviceMix.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum serviço encontrado no período selecionado
                  </p>
                ) : (
                  <div className="space-y-4">
                    {metrics.serviceMix.map((service: ServiceMixItem) => (
                      <div
                        key={service.serviceId}
                        className="flex items-center justify-between border-b pb-3"
                      >
                        <div>
                          <div className="font-medium">{service.serviceName}</div>
                          <div className="text-sm text-muted-foreground">
                            {service.count} agendamentos
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(service.revenue / 100)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {metrics.summary.totalAppointments > 0
                              ? `${((service.count / metrics.summary.totalAppointments) * 100).toFixed(1)}% do total`
                              : '0% do total'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

