'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@proagenda/ui';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TimeseriesData } from '@proagenda/api-client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentsChartProps {
  data: TimeseriesData[];
}

export function AppointmentsChart({ data }: AppointmentsChartProps) {
  // Garantir que data seja sempre um array
  const safeData = Array.isArray(data) ? data : [];
  
  const chartData = safeData.map((item) => ({
    ...item,
    dateFormatted: format(new Date(item.date), 'dd/MM', { locale: ptBR }),
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos ao Longo do Tempo</CardTitle>
          <CardDescription>Número de agendamentos por dia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-sm text-muted-foreground">
              Nenhum dado disponível para o período selecionado
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendamentos ao Longo do Tempo</CardTitle>
        <CardDescription>Número de agendamentos por dia</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateFormatted" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="appointments"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Agendamentos"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

