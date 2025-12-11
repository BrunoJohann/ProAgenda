'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@proagenda/ui';
import { Calendar, CheckCircle2, ArrowLeft, Download, MapPin, Phone, Clock, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ConfirmacaoPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = params.tenant as string;

  const [appointmentData, setAppointmentData] = useState<{
    filialName?: string;
    services?: string;
    date?: string;
    professionalName?: string;
    total?: string;
    customerName?: string;
    durationMinutes?: number;
  } | null>(null);

  useEffect(() => {
    // Recuperar dados do sessionStorage ou searchParams
    const stored = sessionStorage.getItem('lastAppointment');
    if (stored) {
      try {
        setAppointmentData(JSON.parse(stored));
        // Limpar após usar
        sessionStorage.removeItem('lastAppointment');
      } catch (e) {
        console.error('Error parsing appointment data:', e);
      }
    }

    // Se não tiver dados, redirecionar para agendar
    if (!stored && !searchParams.get('success')) {
      router.push(`/${tenant}/agendar`);
    }
  }, [tenant, router, searchParams]);

  const handleNewAppointment = () => {
    router.push(`/${tenant}/agendar`);
  };

  const handleDownloadICS = () => {
    if (!appointmentData?.date) return;

    try {
      const startDate = new Date(appointmentData.date);
      const durationMs = (appointmentData.durationMinutes || 60) * 60 * 1000; // Duração em milissegundos
      const endDate = new Date(startDate.getTime() + durationMs);

      // Formatar para UTC no formato ICS
      const formatICSDate = (date: Date) => {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
      };

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//ProAgenda//Agendamento//PT',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:Agendamento - ${appointmentData.services || 'Serviços'}`,
        `DESCRIPTION:Agendamento confirmado para ${appointmentData.filialName || 'Filial'}\\nProfissional: ${appointmentData.professionalName || 'A definir'}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `agendamento-${format(new Date(), 'yyyy-MM-dd')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating ICS:', error);
    }
  };

  if (!appointmentData && !searchParams.get('success')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ProAgenda</span>
            <Badge variant="secondary" className="ml-2">{tenant}</Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Agendamento Confirmado!</CardTitle>
              <CardDescription className="text-base">
                Seu agendamento foi realizado com sucesso. Você receberá uma confirmação em breve.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Appointment Details */}
          {appointmentData && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Detalhes do Agendamento</CardTitle>
                <CardDescription>Confira as informações do seu agendamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointmentData.filialName && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Filial</p>
                      <p className="font-semibold">{appointmentData.filialName}</p>
                    </div>
                  </div>
                )}

                {appointmentData.services && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Serviços</p>
                      <p className="font-semibold">{appointmentData.services}</p>
                    </div>
                  </div>
                )}

                {appointmentData.date && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data e Horário</p>
                      <p className="font-semibold">
                        {format(new Date(appointmentData.date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {appointmentData.professionalName && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Profissional</p>
                      <p className="font-semibold">{appointmentData.professionalName}</p>
                    </div>
                  </div>
                )}

                {appointmentData.customerName && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                      <p className="font-semibold">{appointmentData.customerName}</p>
                    </div>
                  </div>
                )}

                {appointmentData.total && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-semibold">Total</p>
                      <p className="text-2xl font-bold text-primary">{appointmentData.total}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={handleNewAppointment} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Fazer Novo Agendamento
            </Button>
            {appointmentData?.date && (
              <Button onClick={handleDownloadICS} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Adicionar ao Calendário
              </Button>
            )}
          </div>

          {/* Info Box */}
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Importante:</strong> Chegue com alguns minutos de antecedência. Em caso de
                necessidade de cancelamento ou remarcação, entre em contato conosco.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

