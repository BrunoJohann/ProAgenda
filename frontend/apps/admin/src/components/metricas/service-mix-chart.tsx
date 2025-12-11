'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@proagenda/ui';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { ServiceMixItem } from '@proagenda/api-client';

interface ServiceMixChartProps {
  data: ServiceMixItem[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function ServiceMixChart({ data }: ServiceMixChartProps) {
  // Garantir que data seja sempre um array
  const safeData = Array.isArray(data) ? data : [];
  
  const chartData = safeData.map((item) => ({
    name: item.serviceName,
    value: item.count,
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mix de Serviços</CardTitle>
          <CardDescription>Distribuição de agendamentos por serviço</CardDescription>
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
        <CardTitle>Mix de Serviços</CardTitle>
        <CardDescription>Distribuição de agendamentos por serviço</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

