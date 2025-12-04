'use client';

import { useQuery } from '@tanstack/react-query';
import { customerAppointmentsApi } from '@proagenda/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@proagenda/ui';
import { Calendar, Clock, User, MapPin, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

export default function HistoricoPage() {
  const params = useParams();
  const tenant = params.tenant as string;

  const { data: pastAppointments, isLoading } = useQuery({
    queryKey: ['customer-appointments-history', tenant],
    queryFn: () => customerAppointmentsApi.getHistory().then((res) => res.data),
  });

  const { data: serviceHistory } = useQuery({
    queryKey: ['customer-service-history', tenant],
    queryFn: () => customerAppointmentsApi.getServiceHistory().then((res) => res.data),
  });

  const handleRepeatAppointment = (serviceIds: string[]) => {
    // Redirecionar para booking com os serviços pré-selecionados
    const serviceIdsParam = serviceIds.join(',');
    window.location.href = `http://localhost:3003/${tenant}/agendar?serviceIds=${serviceIdsParam}`;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Histórico</h1>
        <p className="mt-2 text-gray-600">Seus agendamentos passados e serviços utilizados</p>
      </div>

      {/* Histórico de Serviços - Repetir Agendamento */}
      {serviceHistory && serviceHistory.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Repetir Agendamento</CardTitle>
            <CardDescription>
              Escolha uma combinação de serviços que você já utilizou
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceHistory.map((history, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {history.serviceNames.map((name, i) => (
                          <Badge key={i} variant="outline">
                            {name}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Última vez: {format(new Date(history.lastUsedAt), "dd/MM/yyyy", { locale: ptBR })} • 
                        Usado {history.count} {history.count === 1 ? 'vez' : 'vezes'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRepeatAppointment(history.serviceIds)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Repetir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agendamentos Passados */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos Passados</CardTitle>
          <CardDescription>Histórico dos seus agendamentos anteriores</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !pastAppointments || pastAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum agendamento passado encontrado</p>
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(apt.startsAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
                      {apt.services && apt.services.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-2">
                            {apt.services.map((as, idx) => (
                              <Badge key={idx} variant="secondary">
                                {as.service?.name || 'Serviço'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Badge variant={apt.status === 'CONFIRMED' ? 'default' : 'destructive'}>
                      {apt.status === 'CONFIRMED' ? 'Confirmado' : 'Cancelado'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


