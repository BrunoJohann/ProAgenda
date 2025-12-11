'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Input, Label } from '@proagenda/ui';
import { Calendar, Clock, Users, CheckCircle2, ArrowLeft, ArrowRight, Loader2, MapPin, Phone, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filiaisApi, servicesApi, appointmentsApi, customerAppointmentsApi } from '@proagenda/api-client';
import { useCustomerAuthStore } from '@/lib/store/customer-auth-store';
import type { Filial, Service, Slot, CreateCustomerAppointmentDto } from '@proagenda/api-client';

const steps = [
  { id: 1, name: 'Filial', icon: Users },
  { id: 2, name: 'Serviços', icon: Calendar },
  { id: 3, name: 'Data/Hora', icon: Clock },
  { id: 4, name: 'Confirmação', icon: CheckCircle2 },
];

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export default function NovoAgendamentoPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tenant = params.tenant as string;
  const { user } = useCustomerAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFilial, setSelectedFilial] = useState<Filial | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<(Slot & { professionalId: string; professionalName: string }) | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usedQuickSelect, setUsedQuickSelect] = useState(false);

  // Get service history for quick select
  const { data: serviceHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['customer-service-history', tenant],
    queryFn: () => customerAppointmentsApi.getServiceHistory().then((res) => res.data),
    enabled: !!tenant,
  });

  // Get last used services (most recent)
  const lastServiceHistory = serviceHistory && serviceHistory.length > 0 ? serviceHistory[0] : null;

  // Get filiais
  const { data: filiais, isLoading: loadingFiliais } = useQuery({
    queryKey: ['public-filiais', tenant],
    queryFn: async () => {
      const response = await filiaisApi.listPublic(tenant);
      return response.data;
    },
    enabled: !!tenant,
  });

  // Get services
  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ['public-services', tenant, selectedFilial?.id],
    queryFn: async () => {
      const response = await servicesApi.listPublic({ tenant, filialId: selectedFilial!.id });
      return response.data;
    },
    enabled: !!selectedFilial && !!tenant,
  });

  // Get slots
  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ['public-slots', tenant, selectedFilial?.id, selectedDate, selectedServices.map(s => s.id).join(',')],
    queryFn: async () => {
      const response = await appointmentsApi.getSlots({
        tenant,
        filialId: selectedFilial!.id,
        date: format(selectedDate!, 'yyyy-MM-dd'),
        serviceIds: selectedServices.map(s => s.id).join(','),
      });
      return response.data;
    },
    enabled: !!selectedFilial && !!selectedDate && selectedServices.length > 0 && !!tenant,
  });

  // Create appointment mutation
  const createAppointment = useMutation({
    mutationFn: (data: CreateCustomerAppointmentDto) => 
      customerAppointmentsApi.create(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-appointments', tenant] });
      queryClient.invalidateQueries({ queryKey: ['customer-service-history', tenant] });
      toast.success('Agendamento criado com sucesso!');
      router.push(`/${tenant}/meus-agendamentos`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao criar agendamento. Tente novamente.');
    },
  });

  const handleQuickSelect = () => {
    if (!lastServiceHistory || !selectedFilial || !services) {
      toast.error('Selecione uma filial primeiro');
      return;
    }
    
    const lastServiceIds = lastServiceHistory.serviceIds;
    const matchingServices = services.filter(s => lastServiceIds.includes(s.id));
    
    if (matchingServices.length === lastServiceIds.length) {
      setSelectedServices(matchingServices);
      setUsedQuickSelect(true);
      // Don't skip to date/time - let user confirm and proceed manually
      toast.success('Serviços do último agendamento selecionados! Revise e clique em "Próximo" para continuar.');
    } else {
      toast.error('Alguns serviços não estão mais disponíveis nesta filial');
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !selectedFilial) {
      toast.error('Selecione uma filial');
      return;
    }
    if (currentStep === 2 && selectedServices.length === 0) {
      toast.error('Selecione pelo menos um serviço');
      return;
    }
    if (currentStep === 3 && (!selectedDate || !selectedSlot)) {
      toast.error('Selecione uma data e horário');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const totalPrice = selectedServices.reduce((sum, service) => sum + service.priceCents, 0);
  const totalDuration = selectedServices.reduce((sum, service) => sum + service.durationMinutes, 0);

  const onSubmit = async () => {
    if (!selectedFilial || !selectedDate || !selectedSlot || selectedServices.length === 0) {
      toast.error('Complete todas as etapas antes de confirmar');
      return;
    }

    setIsSubmitting(true);
    try {
      // Format date and time correctly
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      // selectedSlot.start is already an ISO string from the API
      
      await createAppointment.mutateAsync({
        filialId: selectedFilial.id,
        serviceIds: selectedServices.map((s) => s.id),
        date: dateStr,
        start: selectedSlot.start, // ISO 8601 string
        professionalId: selectedSlot.professionalId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleService = (service: Service) => {
    setSelectedServices((prev) => {
      const isSelected = prev.some((s) => s.id === service.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
    setSelectedSlot(null);
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Steps Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                      currentStep >= step.id
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-white border-muted-foreground/30 text-muted-foreground'
                    }`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium mt-2">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].name}</CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Selecione a unidade de atendimento'}
              {currentStep === 2 && 'Escolha os serviços desejados'}
              {currentStep === 3 && 'Selecione a data e horário'}
              {currentStep === 4 && 'Confirme os detalhes do agendamento'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Filial */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {loadingFiliais ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filiais && filiais.length > 0 ? (
                  <div className="grid gap-4">
                    {filiais.map((filial) => {
                      const isSelected = selectedFilial?.id === filial.id;
                      return (
                        <Button
                          key={filial.id}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`h-auto p-6 justify-start ${
                            isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-accent'
                          }`}
                          onClick={() => setSelectedFilial(filial)}
                        >
                          <div className="text-left flex-1">
                            <p className={`font-semibold ${isSelected ? 'text-primary-foreground' : ''}`}>
                              {filial.name}
                            </p>
                            {filial.address && (
                              <p className={`text-sm flex items-center gap-1 mt-1 ${
                                isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'
                              }`}>
                                <MapPin className="h-3 w-3" />
                                {filial.address}
                              </p>
                            )}
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma filial disponível
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Serviços */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {/* Quick Select - Last Appointment */}
                {lastServiceHistory && selectedFilial && services && services.length > 0 && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-blue-900 mb-2">🔄 Repetir último agendamento</p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {lastServiceHistory.serviceNames.map((name, i) => (
                              <Badge key={i} variant="outline" className="bg-white">
                                {name}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-blue-700">
                            Última vez: {format(new Date(lastServiceHistory.lastUsedAt), "dd/MM/yyyy", { locale: ptBR })} • 
                            Usado {lastServiceHistory.count} {lastServiceHistory.count === 1 ? 'vez' : 'vezes'}
                          </p>
                        </div>
                        <Button
                          onClick={handleQuickSelect}
                          className="ml-4"
                          size="lg"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Usar Estes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {loadingServices ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : services && services.length > 0 ? (
                  <>
                    <div className="grid gap-4">
                      {services.map((service) => {
                        const isSelected = selectedServices.some((s) => s.id === service.id);
                        return (
                          <Button
                            key={service.id}
                            variant={isSelected ? 'default' : 'outline'}
                            className={`h-auto p-4 justify-between ${
                              isSelected
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                : 'hover:bg-accent'
                            }`}
                            onClick={() => toggleService(service)}
                          >
                            <div className="text-left">
                              <p className={`font-semibold ${isSelected ? 'text-primary-foreground' : ''}`}>
                                {service.name}
                              </p>
                              <p className={`text-sm ${
                                isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'
                              }`}>
                                {formatDuration(service.durationMinutes)}
                              </p>
                            </div>
                            <span className={`font-semibold ${isSelected ? 'text-primary-foreground' : ''}`}>
                              {formatPrice(service.priceCents)}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                    {selectedServices.length > 0 && (
                      <div className="mt-6 p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total selecionado:</span>
                          <div className="text-right">
                            <p className="font-semibold text-lg">{formatPrice(totalPrice)}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDuration(totalDuration)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum serviço disponível
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Data/Hora */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">Selecione a data</Label>
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={ptBR}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="mx-auto"
                  />
                </div>

                {selectedDate && (
                  <div>
                    <Label className="mb-2 block">
                      Horários disponíveis{' '}
                      {selectedSlot && `- ${format(new Date(selectedSlot.start), 'HH:mm', { locale: ptBR })}`}
                    </Label>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : slots && slots.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {slots.map((slot) => {
                          const slotTime = format(new Date(slot.start), 'HH:mm', { locale: ptBR });
                          const isSelected = selectedSlot?.start === slot.start;
                          const professionalName = slot.professionalOptions.find(
                            (p) => p.professionalId === slot.recommendedProfessionalId
                          )?.professionalName || slot.professionalOptions[0]?.professionalName || 'Profissional';
                          return (
                            <Button
                              key={slot.start}
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              className={
                                isSelected
                                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                  : 'hover:bg-accent'
                              }
                              onClick={() => setSelectedSlot({
                                ...slot,
                                professionalId: slot.recommendedProfessionalId,
                                professionalName,
                              })}
                              title={professionalName}
                            >
                              {slotTime}
                            </Button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum horário disponível para esta data
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Confirmação */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold">Resumo do Agendamento</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Filial:</span>
                      <span className="font-medium">{selectedFilial?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Serviços:</span>
                      <span className="font-medium">
                        {selectedServices.map((s) => s.name).join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data:</span>
                      <span className="font-medium">
                        {selectedDate && format(selectedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {selectedSlot && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profissional:</span>
                        <span className="font-medium">{selectedSlot.professionalName || 'A definir'}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-semibold">Total:</span>
                      <span className="font-semibold">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Cliente:</strong> {user?.name} ({user?.email})
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Seus dados já estão cadastrados. O agendamento será criado automaticamente.
                  </p>
                </div>

                <Button 
                  onClick={onSubmit} 
                  className="w-full" 
                  size="lg" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    'Confirmar Agendamento'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        {currentStep !== 4 && (
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={nextStep}>
              Próximo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
