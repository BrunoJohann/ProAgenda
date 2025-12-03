'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateProfessional, useUpdateProfessional, type Professional } from '@proagenda/api-client';
import { Button, Input, Label, Select } from '@proagenda/ui';
import { toast } from 'sonner';

const professionalSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  bio: z.string().optional(),
  specialties: z.string().optional(),
  timezone: z.string().optional(),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

interface ProfessionalFormProps {
  filialId: string;
  professional?: Professional;
  onSuccess?: () => void;
}

export function ProfessionalForm({ filialId, professional, onSuccess }: ProfessionalFormProps) {
  const createMutation = useCreateProfessional();
  const updateMutation = useUpdateProfessional();
  const isEditing = !!professional;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: professional || {
      timezone: 'America/Sao_Paulo',
    },
  });

  const onSubmit = async (data: ProfessionalFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ filialId, id: professional.id, data });
        toast.success('Profissional atualizado com sucesso!');
      } else {
        await createMutation.mutateAsync({ filialId, data });
        toast.success('Profissional criado com sucesso!');
        reset();
      }
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar profissional');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          placeholder="João da Silva"
          {...register('name')}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Biografia</Label>
        <Input
          id="bio"
          placeholder="Especialista em cortes modernos..."
          {...register('bio')}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialties">Especialidades</Label>
        <Input
          id="specialties"
          placeholder="Cortes, barba, coloração"
          {...register('specialties')}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          placeholder="America/Sao_Paulo"
          {...register('timezone')}
          disabled={isLoading}
        />
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

