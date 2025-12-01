'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateFilial, CreateFilialDto } from '@proagenda/api-client';
import { Button, Input, Label } from '@proagenda/ui';
import { toast } from 'sonner';

const filialSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  slug: z.string().min(3, 'Slug deve ter no mínimo 3 caracteres').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  timezone: z.string().min(1, 'Timezone é obrigatório'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type FilialFormData = z.infer<typeof filialSchema>;

interface FilialFormProps {
  onSuccess?: () => void;
}

export function FilialForm({ onSuccess }: FilialFormProps) {
  const createMutation = useCreateFilial();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FilialFormData>({
    resolver: zodResolver(filialSchema),
    defaultValues: {
      timezone: 'America/Sao_Paulo',
    },
  });

  const onSubmit = async (data: FilialFormData) => {
    try {
      await createMutation.mutateAsync(data as CreateFilialDto);
      toast.success('Filial criada com sucesso!');
      reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar filial');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            placeholder="Centro"
            {...register('name')}
            disabled={createMutation.isPending}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            placeholder="centro"
            {...register('slug')}
            disabled={createMutation.isPending}
          />
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone *</Label>
        <Input
          id="timezone"
          placeholder="America/Sao_Paulo"
          {...register('timezone')}
          disabled={createMutation.isPending}
        />
        {errors.timezone && (
          <p className="text-sm text-destructive">{errors.timezone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          placeholder="Filial localizada no centro da cidade"
          {...register('description')}
          disabled={createMutation.isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          placeholder="Rua das Flores, 123"
          {...register('address')}
          disabled={createMutation.isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          placeholder="(11) 99999-9999"
          {...register('phone')}
          disabled={createMutation.isPending}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={createMutation.isPending}
        >
          Limpar
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}

