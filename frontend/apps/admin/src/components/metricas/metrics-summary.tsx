import { Card, CardContent, CardHeader, CardTitle } from '@proagenda/ui';
import { Calendar, XCircle, TrendingUp, DollarSign } from 'lucide-react';
import type { MetricsSummary } from '@proagenda/api-client';

interface MetricsSummaryProps {
  summary: MetricsSummary;
}

export function MetricsSummaryCards({ summary }: MetricsSummaryProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary?.totalAppointments || 0}</div>
          <p className="text-xs text-muted-foreground">
            {summary?.confirmedAppointments || 0} confirmados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Cancelamento</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary?.cancelRate?.toFixed(1) || '0.0'}%</div>
          <p className="text-xs text-muted-foreground">
            {summary?.canceledAppointments || 0} cancelados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary?.occupancyRate?.toFixed(1) || '0.0'}%</div>
          <p className="text-xs text-muted-foreground">
            Da capacidade total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary?.revenue || 0)}</div>
          <p className="text-xs text-muted-foreground">
            Período selecionado
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

