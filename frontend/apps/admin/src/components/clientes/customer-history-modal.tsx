'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Badge,
} from '@proagenda/ui';
import { type Customer, useAppointments } from '@proagenda/api-client';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomerHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    CONFIRMED: 'Confirmado',
    PENDING: 'Pendente',
    CANCELED: 'Cancelado',
    COMPLETED: 'Concluído',
    NO_SHOW: 'Não compareceu',
  };
  return statusMap[status] || status;
};

const getStatusVariant = (status: string) => {
  if (status === 'CONFIRMED' || status === 'COMPLETED') return 'default';
  if (status === 'CANCELED' || status === 'NO_SHOW') return 'destructive';
  return 'secondary';
};

export function CustomerHistoryModal({
  open,
  onOpenChange,
  customer,
}: CustomerHistoryModalProps) {
  const { data: appointments, isLoading } = useAppointments({
    customerId: customer.id,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de Agendamentos</DialogTitle>
          <DialogDescription>
            Histórico de agendamentos de {customer.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : !appointments || appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum agendamento encontrado
            </p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {appointment.services?.[0]?.service?.name || 'Serviço'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.professional?.name}
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(appointment.status)}>
                      {getStatusLabel(appointment.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(appointment.startsAt), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(appointment.startsAt), "HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

