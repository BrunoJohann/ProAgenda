'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateService, useUpdateService, type Service } from '@proagenda/api-client';
import { Button, Input, Label } from '@proagenda/ui';
import { toast } from 'sonner';

const serviceSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  durationMinutes: z.coerce.number().min(1, 'Duração deve ser maior que 0'),
  bufferMinutes: z.coerce.number().min(0, 'Buffer deve ser maior ou igual a 0').optional(),
  priceCents: z.coerce.number().min(0, 'Preço deve ser maior ou igual a 0'),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  filialId: string;
  service?: Service;
  onSuccess?: () => void;
}

export function ServiceForm({ filialId, service, onSuccess }: ServiceFormProps) {
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const isEditing = !!service;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service
      ? {
          name: service.name,
          durationMinutes: service.durationMinutes,
          bufferMinutes: service.bufferMinutes,
          priceCents: service.priceCents / 100, // Converter centavos para reais
        }
      : {
          bufferMinutes: 0,
          priceCents: 0,
        },
  });

  const onSubmit = async (data: ServiceFormData) => {
    try {
      const payload = {
        ...data,
        priceCents: Math.round(data.priceCents * 100), // Converter para centavos
        bufferMinutes: data.bufferMinutes || 0,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ filialId, id: service.id, data: payload });
        toast.success('Serviço atualizado com sucesso!');
      } else {
        await createMutation.mutateAsync({ filialId, data: payload });
        toast.success('Serviço criado com sucesso!');
        reset();
      }
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar serviço');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Serviço *</Label>
        <Input
          id="name"
          placeholder="Corte de cabelo"
          {...register('name')}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="durationMinutes">Duração (minutos) *</Label>
          <Input
            id="durationMinutes"
            type="number"
            placeholder="30"
            {...register('durationMinutes')}
            disabled={isLoading}
          />
          {errors.durationMinutes && (
            <p className="text-sm text-destructive">{errors.durationMinutes.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bufferMinutes">Buffer (minutos)</Label>
          <Input
            id="bufferMinutes"
            type="number"
            placeholder="0"
            {...register('bufferMinutes')}
            disabled={isLoading}
          />
          {errors.bufferMinutes && (
            <p className="text-sm text-destructive">{errors.bufferMinutes.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priceCents">Preço (R$) *</Label>
        <Input
          id="priceCents"
          type="number"
          step="0.01"
          placeholder="50.00"
          {...register('priceCents')}
          disabled={isLoading}
        />
        {errors.priceCents && (
          <p className="text-sm text-destructive">{errors.priceCents.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isLoading}
        >
          Limpar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}


