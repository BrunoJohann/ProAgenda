'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  Badge,
} from '@proagenda/ui';
import { useWorkingPeriods, useCreatePeriod, useDeletePeriod, type Professional } from '@proagenda/api-client';
import { Plus, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface WorkingHoursModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professional: Professional;
  filialId: string;
}

const WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

export function WorkingHoursModal({
  open,
  onOpenChange,
  professional,
  filialId,
}: WorkingHoursModalProps) {
  const { data: periods, isLoading } = useWorkingPeriods(filialId, professional.id);
  const createMutation = useCreatePeriod();
  const deleteMutation = useDeletePeriod();

  const [weekday, setWeekday] = useState<number>(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

  const handleAdd = async () => {
    try {
      await createMutation.mutateAsync({
        filialId,
        professionalId: professional.id,
        data: {
          weekday,
          startMinutes: timeToMinutes(startTime),
          endMinutes: timeToMinutes(endTime),
        },
      });
      toast.success('Horário adicionado com sucesso!');
      setStartTime('09:00');
      setEndTime('18:00');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao adicionar horário');
    }
  };

  const handleDelete = async (periodId: string) => {
    try {
      await deleteMutation.mutateAsync({
        filialId,
        professionalId: professional.id,
        periodId,
      });
      toast.success('Horário removido com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao remover horário');
    }
  };

  const groupedPeriods = periods?.reduce((acc, period) => {
    if (!acc[period.weekday]) acc[period.weekday] = [];
    acc[period.weekday].push(period);
    return acc;
  }, {} as Record<number, typeof periods>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Horários de Trabalho</DialogTitle>
          <DialogDescription>
            Configure os horários de trabalho de {professional.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Adicionar novo horário */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Horário
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Dia da Semana</Label>
                <select
                  className="w-full h-9 px-3 rounded-md border border-input bg-background"
                  value={weekday}
                  onChange={(e) => setWeekday(Number(e.target.value))}
                >
                  {WEEKDAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Início</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleAdd}
              disabled={createMutation.isPending}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {/* Lista de horários */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horários Cadastrados
            </h4>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : !periods || periods.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum horário cadastrado ainda
              </p>
            ) : (
              <div className="space-y-3">
                {WEEKDAYS.map((day) => {
                  const dayPeriods = groupedPeriods?.[day.value];
                  if (!dayPeriods || dayPeriods.length === 0) return null;

                  return (
                    <div key={day.value} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{day.label}</Badge>
                      </div>
                      <div className="space-y-2">
                        {dayPeriods.map((period) => (
                          <div
                            key={period.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>
                              {minutesToTime(period.startMinutes)} -{' '}
                              {minutesToTime(period.endMinutes)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(period.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

