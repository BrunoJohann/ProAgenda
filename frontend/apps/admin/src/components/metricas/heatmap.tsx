'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@proagenda/ui';
import type { HeatmapData } from '@proagenda/api-client';

interface HeatmapProps {
  data: HeatmapData[];
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8h às 19h

export function Heatmap({ data }: HeatmapProps) {
  // Garantir que data seja sempre um array
  const safeData = Array.isArray(data) ? data : [];
  
  const getIntensity = (weekday: number, hour: number) => {
    const item = safeData.find((d) => d.weekday === weekday && d.hour === hour);
    return item?.count || 0;
  };

  const counts = safeData.map((d) => d.count);
  const maxCount = counts.length > 0 ? Math.max(...counts, 1) : 1;

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    const intensity = count / maxCount;
    if (intensity < 0.2) return 'bg-blue-200';
    if (intensity < 0.4) return 'bg-blue-300';
    if (intensity < 0.6) return 'bg-blue-400';
    if (intensity < 0.8) return 'bg-blue-500';
    return 'bg-blue-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Calor - Horários</CardTitle>
        <CardDescription>
          Intensidade de agendamentos por dia da semana e horário
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-flex gap-1">
            {/* Coluna de labels de horas */}
            <div className="flex flex-col gap-1">
              <div className="h-8" /> {/* Espaço para os dias da semana */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-8 flex items-center justify-end pr-2 text-xs text-muted-foreground"
                >
                  {hour}h
                </div>
              ))}
            </div>

            {/* Colunas de dados */}
            {WEEKDAYS.map((day, weekdayIndex) => (
              <div key={weekdayIndex} className="flex flex-col gap-1">
                <div className="h-8 flex items-center justify-center text-xs font-medium">
                  {day}
                </div>
                {HOURS.map((hour) => {
                  const count = getIntensity(weekdayIndex, hour);
                  return (
                    <div
                      key={hour}
                      className={`h-8 w-12 rounded flex items-center justify-center text-xs font-medium ${getColor(
                        count
                      )}`}
                      title={`${day} ${hour}h: ${count} agendamentos`}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <span>Menos</span>
          <div className="flex gap-1">
            <div className="h-4 w-4 bg-gray-100 rounded" />
            <div className="h-4 w-4 bg-blue-200 rounded" />
            <div className="h-4 w-4 bg-blue-300 rounded" />
            <div className="h-4 w-4 bg-blue-400 rounded" />
            <div className="h-4 w-4 bg-blue-500 rounded" />
            <div className="h-4 w-4 bg-blue-600 rounded" />
          </div>
          <span>Mais</span>
        </div>
      </CardContent>
    </Card>
  );
}

