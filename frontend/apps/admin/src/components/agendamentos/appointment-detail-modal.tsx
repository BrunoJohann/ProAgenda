'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Badge,
  Button,
  Separator,
} from '@proagenda/ui';
import { type Appointment, AppointmentStatus } from '@proagenda/api-client';
import { Calendar, Clock, User, Phone, Mail, Scissors, MapPin, FileText, Ban, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment;
  onEdit?: () => void;
  onCancel?: () => void;
}

const STATUS_VARIANTS: Record<AppointmentStatus, 'default' | 'secondary'> = {
  CONFIRMED: 'default',
  CANCELED: 'secondary',
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: 'Confirmado',
  CANCELED: 'Cancelado',
};

export function AppointmentDetailModal({
  open,
  onOpenChange,
  appointment,
  onEdit,
  onCancel,
}: AppointmentDetailModalProps) {
  const canCancel = appointment.status === 'CONFIRMED';
  const canEdit = appointment.status === 'CONFIRMED';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Agendamento</DialogTitle>
          <DialogDescription>
            Informações completas do agendamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={STATUS_VARIANTS[appointment.status]}>
              {STATUS_LABELS[appointment.status]}
            </Badge>
          </div>

          <Separator />

          {/* Data e Hora */}
          <div className="space-y-3">
            <h4 className="font-medium">Data e Horário</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(appointment.startsAt), "dd 'de' MMMM, yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(appointment.startsAt), "HH:mm", { locale: ptBR })} -{' '}
                  {format(new Date(appointment.endsAt), "HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cliente */}
          <div className="space-y-3">
            <h4 className="font-medium">Cliente</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{appointment.customerName}</span>
              </div>
              {appointment.customerPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.customerPhone}</span>
                </div>
              )}
              {appointment.customerEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.customerEmail}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Profissional */}
          {appointment.professional && (
            <>
              <div className="space-y-3">
                <h4 className="font-medium">Profissional</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Scissors className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.professional.name}</span>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Serviços */}
          {appointment.services && appointment.services.length > 0 && (
            <>
              <div className="space-y-3">
                <h4 className="font-medium">Serviços</h4>
                <div className="flex flex-wrap gap-2">
                  {appointment.services.map((svc) => (
                    <Badge key={svc.id} variant="secondary">
                      {svc.service?.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Observações */}
          {appointment.notes && (
            <>
              <div className="space-y-3">
                <h4 className="font-medium">Observações</h4>
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">{appointment.notes}</span>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Ações */}
          {(canEdit || canCancel) && (
            <div className="flex justify-end gap-2">
              {canEdit && onEdit && (
                <Button variant="outline" onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              {canCancel && onCancel && (
                <Button variant="destructive" onClick={onCancel}>
                  <Ban className="h-4 w-4 mr-2" />
                  Cancelar Agendamento
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

