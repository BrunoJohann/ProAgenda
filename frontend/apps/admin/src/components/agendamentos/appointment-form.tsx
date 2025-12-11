'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useProfessionals,
  useServices,
  useCustomers,
  useCreateInternalAppointment,
  useUpdateAppointment,
  type CreateInternalAppointmentDto,
  type UpdateAppointmentDto,
  type Appointment,
} from '@proagenda/api-client';
import { Button, Input, Label, Checkbox } from '@proagenda/ui';
import { toast } from 'sonner';
import { format } from 'date-fns';

const appointmentSchema = z.object({
  professionalId: z.string().min(1, 'Selecione um profissional'),
  serviceIds: z.array(z.string()).min(1, 'Selecione pelo menos um serviço'),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Hora é obrigatória'),
  customerName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  filialId: string;
  appointment?: Appointment;
  onSuccess?: () => void;
}

export function AppointmentForm({ filialId, appointment, onSuccess }: AppointmentFormProps) {
  const { data: professionals } = useProfessionals(filialId);
  const { data: services } = useServices(filialId);
  const { data: customers } = useCustomers(filialId);
  const createMutation = useCreateInternalAppointment();
  const updateMutation = useUpdateAppointment();
  const isEditing = !!appointment;
  
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
    },
  });

  // Preencher formulário quando estiver editando
  useEffect(() => {
    if (appointment) {
      const appointmentDate = new Date(appointment.startsAt);
      const dateStr = format(appointmentDate, 'yyyy-MM-dd');
      const timeStr = format(appointmentDate, 'HH:mm');
      const serviceIds = appointment.services?.map((s: any) => s.serviceId || s.service?.id) || [];
      
      setSelectedServiceIds(serviceIds);
      reset({
        professionalId: appointment.professionalId || '',
        serviceIds,
        date: dateStr,
        time: timeStr,
        customerName: appointment.customerName || '',
        customerPhone: appointment.customerPhone || '',
        customerEmail: appointment.customerEmail || '',
        notes: appointment.notes || '',
      });
    }
  }, [appointment, reset]);

  const handleServiceToggle = (serviceId: string) => {
    const newSelected = selectedServiceIds.includes(serviceId)
      ? selectedServiceIds.filter((id) => id !== serviceId)
      : [...selectedServiceIds, serviceId];
    
    setSelectedServiceIds(newSelected);
    setValue('serviceIds', newSelected);
  };

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      // Combinar data e hora no formato ISO 8601
      // Usar timezone local e converter para ISO
      const [year, month, day] = data.date.split('-').map(Number);
      const [hours, minutes] = data.time.split(':').map(Number);
      const dateObj = new Date(year, month - 1, day, hours, minutes);
      const start = dateObj.toISOString();

      if (isEditing) {
        const payload: UpdateAppointmentDto = {
          date: data.date, // YYYY-MM-DD
          start, // ISO 8601
          serviceIds: data.serviceIds,
          professionalId: data.professionalId || undefined,
          newCustomer: {
            name: data.customerName,
            phone: data.customerPhone || undefined,
            email: data.customerEmail || undefined,
          },
          notes: data.notes || undefined,
        };

        await updateMutation.mutateAsync({ id: appointment.id, data: payload });
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        const payload: CreateInternalAppointmentDto = {
          filialId,
          date: data.date, // YYYY-MM-DD
          start, // ISO 8601
          serviceIds: data.serviceIds,
          professionalId: data.professionalId || undefined,
          newCustomer: {
            name: data.customerName,
            phone: data.customerPhone || undefined,
            email: data.customerEmail || undefined,
          },
          notes: data.notes || undefined,
        };

        await createMutation.mutateAsync({ filialId, data: payload });
        toast.success('Agendamento criado com sucesso!');
      }

      reset();
      setSelectedServiceIds([]);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Erro ao ${isEditing ? 'atualizar' : 'criar'} agendamento`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Profissional */}
      <div className="space-y-2">
        <Label htmlFor="professionalId">Profissional *</Label>
        <select
          id="professionalId"
          className="w-full h-9 px-3 rounded-md border border-input bg-background"
          {...register('professionalId')}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          <option value="">Selecione um profissional</option>
          {professionals?.filter(p => p.isActive).map((prof) => (
            <option key={prof.id} value={prof.id}>
              {prof.name}
            </option>
          ))}
        </select>
        {errors.professionalId && (
          <p className="text-sm text-destructive">{errors.professionalId.message}</p>
        )}
      </div>

      {/* Serviços */}
      <div className="space-y-2">
        <Label>Serviços *</Label>
        <div className="border rounded-lg p-3 space-y-2 max-h-[200px] overflow-y-auto">
          {services?.filter(s => s.isActive).map((service) => (
            <div key={service.id} className="flex items-center gap-2">
              <Checkbox
                id={service.id}
                checked={selectedServiceIds.includes(service.id)}
                onCheckedChange={() => handleServiceToggle(service.id)}
                disabled={createMutation.isPending || updateMutation.isPending}
              />
              <label htmlFor={service.id} className="text-sm cursor-pointer">
                {service.name} ({service.durationMinutes} min)
              </label>
            </div>
          ))}
        </div>
        {errors.serviceIds && (
          <p className="text-sm text-destructive">{errors.serviceIds.message}</p>
        )}
      </div>

      {/* Data e Hora */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Data *</Label>
          <Input
            id="date"
            type="date"
          {...register('date')}
          disabled={createMutation.isPending || updateMutation.isPending}
          />
          {errors.date && (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Hora *</Label>
          <Input
            id="time"
            type="time"
          {...register('time')}
          disabled={createMutation.isPending || updateMutation.isPending}
          />
          {errors.time && (
            <p className="text-sm text-destructive">{errors.time.message}</p>
          )}
        </div>
      </div>

      {/* Cliente */}
      <div className="space-y-2">
        <Label htmlFor="customerName">Nome do Cliente *</Label>
        <Input
          id="customerName"
          placeholder="João da Silva"
          {...register('customerName')}
          disabled={createMutation.isPending || updateMutation.isPending}
        />
        {errors.customerName && (
          <p className="text-sm text-destructive">{errors.customerName.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerPhone">Telefone</Label>
          <Input
            id="customerPhone"
            placeholder="(11) 99999-9999"
          {...register('customerPhone')}
          disabled={createMutation.isPending || updateMutation.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerEmail">Email</Label>
          <Input
            id="customerEmail"
            type="email"
            placeholder="joao@email.com"
          {...register('customerEmail')}
          disabled={createMutation.isPending || updateMutation.isPending}
          />
          {errors.customerEmail && (
            <p className="text-sm text-destructive">{errors.customerEmail.message}</p>
          )}
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Input
          id="notes"
          placeholder="Observações adicionais..."
          {...register('notes')}
          disabled={createMutation.isPending || updateMutation.isPending}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset();
            setSelectedServiceIds([]);
          }}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          Limpar
        </Button>
        <Button 
          type="submit" 
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending
            ? (isEditing ? 'Atualizando...' : 'Criando...')
            : (isEditing ? 'Atualizar Agendamento' : 'Criar Agendamento')}
        </Button>
      </div>
    </form>
  );
}

