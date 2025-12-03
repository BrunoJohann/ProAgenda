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
import { Calendar, Clock, Users, CheckCircle2, ArrowLeft, ArrowRight, Loader2, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { usePublicFiliais, usePublicServices, usePublicSlots, useCreatePublicAppointment } from '@proagenda/api-client';
import type { Filial, Service, Slot } from '@proagenda/api-client';

const steps = [
  { id: 1, name: 'Filial', icon: Users },
  { id: 2, name: 'Serviços', icon: Calendar },
  { id: 3, name: 'Data/Hora', icon: Clock },
  { id: 4, name: 'Confirmação', icon: CheckCircle2 },
];

const customerFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().min(10, 'Telefone inválido').regex(/^[\d\s()+-]+$/, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

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

export default function AgendarPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFilial, setSelectedFilial] = useState<Filial | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<(Slot & { professionalId: string; professionalName: string }) | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: filiais, isLoading: loadingFiliais, error: filiaisError } = usePublicFiliais(tenant);
  const { data: services, isLoading: loadingServices } = usePublicServices(
    selectedFilial ? { tenant, filialId: selectedFilial.id } : undefined
  );
  const { data: slots, isLoading: loadingSlots } = usePublicSlots(
    selectedFilial && selectedDate && selectedServices.length > 0
      ? {
          tenant,
          filialId: selectedFilial.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          serviceIds: selectedServices.map((s) => s.id).join(','),
          professionalId: undefined,
        }
      : undefined
  );

  const createAppointment = useCreatePublicAppointment();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
  });

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

  const onSubmit = async (data: CustomerFormData) => {
    if (!selectedFilial || !selectedDate || !selectedSlot || selectedServices.length === 0) {
      toast.error('Complete todas as etapas antes de confirmar');
      return;
    }

    setIsSubmitting(true);
    try {
      const appointment = await createAppointment.mutateAsync({
        tenant,
        data: {
          filialId: selectedFilial.id,
          serviceIds: selectedServices.map((s) => s.id),
          date: format(selectedDate, 'yyyy-MM-dd'),
          start: selectedSlot.start,
          professionalId: selectedSlot.professionalId,
          customer: {
            name: data.name,
            phone: data.phone,
            email: data.email || undefined,
          },
        },
      });

      // Salvar dados do agendamento para a página de confirmação
      const appointmentData = {
        filialName: selectedFilial.name,
        services: selectedServices.map((s) => s.name).join(', '),
        date: selectedSlot.start,
        professionalName: selectedSlot.professionalName || 'A definir',
        total: formatPrice(totalPrice),
        customerName: data.name,
        durationMinutes: totalDuration,
      };

      sessionStorage.setItem('lastAppointment', JSON.stringify(appointmentData));

      toast.success('Agendamento confirmado com sucesso!');
      
      // Redirecionar para página de confirmação
      router.push(`/${tenant}/confirmacao?success=true`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao criar agendamento. Tente novamente.');
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
    // Reset slot when services change
    setSelectedSlot(null);
  };

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
                {currentStep === 4 && 'Confirme seus dados'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 1: Filial */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {loadingFiliais ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Carregando filiais...</span>
                    </div>
                  ) : filiaisError ? (
                    <div className="text-center py-8">
                      <p className="text-destructive font-medium mb-2">Erro ao carregar filiais</p>
                      <p className="text-sm text-muted-foreground">
                        {filiaisError instanceof Error ? filiaisError.message : 'Tente novamente mais tarde'}
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => window.location.reload()}
                      >
                        Recarregar
                      </Button>
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
                              isSelected
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                : 'hover:bg-accent'
                            }`}
                            onClick={() => setSelectedFilial(filial)}
                          >
                            <div className="text-left flex-1">
                              <p className={`font-semibold ${isSelected ? 'text-primary-foreground' : ''}`}>
                                {filial.name}
                              </p>
                              {filial.address && (
                                <p
                                  className={`text-sm flex items-center gap-1 mt-1 ${
                                    isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'
                                  }`}
                                >
                                  <MapPin className="h-3 w-3" />
                                  {filial.address}
                                </p>
                              )}
                              {filial.phone && (
                                <p
                                  className={`text-sm flex items-center gap-1 mt-1 ${
                                    isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'
                                  }`}
                                >
                                  <Phone className="h-3 w-3" />
                                  {filial.phone}
                                </p>
                              )}
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="mb-2">Nenhuma filial disponível</p>
                      <p className="text-sm">Verifique se o tenant "{tenant}" está correto</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Serviços */}
              {currentStep === 2 && (
                <div className="space-y-4">
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
                                <p
                                  className={`text-sm ${
                                    isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'
                                  }`}
                                >
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        placeholder="Seu nome completo"
                        {...register('name')}
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        {...register('phone')}
                        className={errors.phone ? 'border-destructive' : ''}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail (opcional)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        {...register('email')}
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      'Confirmar Agendamento'
                    )}
                  </Button>
                </form>
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
    </div>
  );
}
