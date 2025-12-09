import { Badge } from '@proagenda/ui';
import { Clock, User, Scissors, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Appointment, AppointmentStatus } from '@proagenda/api-client';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: () => void;
}

const STATUS_VARIANTS: Record<AppointmentStatus, 'default' | 'secondary'> = {
  CONFIRMED: 'default',
  CANCELED: 'secondary',
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: 'Confirmado',
  CANCELED: 'Cancelado',
};

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  return (
    <div
      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1">
          <div className="font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            {appointment.customerName}
          </div>
          {appointment.customerPhone && (
            <div className="text-sm text-muted-foreground">
              {appointment.customerPhone}
            </div>
          )}
        </div>
        <Badge variant={STATUS_VARIANTS[appointment.status]}>
          {STATUS_LABELS[appointment.status]}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {format(new Date(appointment.startsAt), "dd/MM/yyyy", { locale: ptBR })}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          {format(new Date(appointment.startsAt), "HH:mm", { locale: ptBR })} -{' '}
          {format(new Date(appointment.endsAt), "HH:mm", { locale: ptBR })}
        </div>
        {appointment.professional && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Scissors className="h-4 w-4" />
            {appointment.professional.name}
          </div>
        )}
      </div>

      {appointment.services && appointment.services.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {appointment.services.map((svc) => (
            <Badge key={svc.id} variant="secondary">
              {svc.service?.name}
            </Badge>
          ))}
        </div>
      )}

      {appointment.notes && (
        <div className="mt-3 text-sm text-muted-foreground italic">
          {appointment.notes}
        </div>
      )}
    </div>
  );
}







