'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerAppointmentsApi } from '@proagenda/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Input, Label } from '@proagenda/ui';
import { Calendar, Clock, User, MapPin, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@proagenda/ui';

export default function AgendamentosPage() {
  const params = useParams();
  const tenant = params.tenant as string;
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<{ id: string; date: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['customer-appointments', tenant],
    queryFn: () => customerAppointmentsApi.list().then((res) => res.data),
  });

  const cancelAppointment = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      customerAppointmentsApi.cancel(id, { reason }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-appointments', tenant] });
      queryClient.invalidateQueries({ queryKey: ['customer-appointments-history', tenant] });
      toast.success('Agendamento cancelado com sucesso');
      setCancelDialogOpen(false);
      setAppointmentToCancel(null);
      setCancelReason('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao cancelar agendamento');
    },
  });

  const handleCancelClick = (apt: any) => {
    setAppointmentToCancel({ id: apt.id, date: format(new Date(apt.startsAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) });
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (appointmentToCancel) {
      cancelAppointment.mutate({ id: appointmentToCancel.id, reason: cancelReason || undefined });
    }
  };

  const futureAppointments = appointments?.filter(
    (apt) => new Date(apt.startsAt) > new Date() && apt.status === 'CONFIRMED'
  ) || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meus Agendamentos</h1>
        <p className="mt-2 text-gray-600">Seus agendamentos futuros</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : futureAppointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Nenhum agendamento futuro encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {futureAppointments.map((apt) => (
            <Card key={apt.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold text-lg">
                        {format(new Date(apt.startsAt), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(apt.startsAt), 'HH:mm')} - {format(new Date(apt.endsAt), 'HH:mm')}
                      </span>
                    </div>
                    {apt.professional && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{apt.professional.name}</span>
                      </div>
                    )}
                    {apt.filial && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{apt.filial.name}</span>
                      </div>
                    )}
                    {apt.services && apt.services.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Serviços:</p>
                        <div className="flex flex-wrap gap-2">
                          {apt.services.map((as, idx) => (
                            <Badge key={idx} variant="secondary">
                              {as.service?.name || 'Serviço'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {apt.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Observações: </span>
                          {apt.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={apt.status === 'CONFIRMED' ? 'default' : 'destructive'}>
                      {apt.status === 'CONFIRMED' ? 'Confirmado' : 'Cancelado'}
                    </Badge>
                    {apt.status === 'CONFIRMED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelClick(apt)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Agendamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar o agendamento do dia {appointmentToCancel?.date}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">Motivo do cancelamento (opcional)</Label>
              <Input
                id="reason"
                placeholder="Ex: Mudança de planos, indisponibilidade..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Não, manter agendamento
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelAppointment.isPending}
            >
              {cancelAppointment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Sim, cancelar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
