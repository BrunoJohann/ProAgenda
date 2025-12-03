'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateMe, type User } from '@proagenda/api-client';
import { Button, Input, Label } from '@proagenda/ui';
import { toast } from 'sonner';

const updateMeSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine((data) => {
  // Se password foi preenchido, confirmPassword também deve ser preenchido e igual
  if (data.password && data.password.length > 0) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type UpdateMeFormData = z.infer<typeof updateMeSchema>;

interface UserFormProps {
  user?: User;
}

export function UserForm({ user }: UserFormProps) {
  const updateMutation = useUpdateMe();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateMeFormData>({
    resolver: zodResolver(updateMeSchema),
  });

  // Preencher formulário quando user estiver disponível
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        phone: user.phone || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UpdateMeFormData) => {
    try {
      const { confirmPassword, ...payload } = data;
      // Remover password se estiver vazio
      if (!payload.password) {
        delete payload.password;
      }
      
      await updateMutation.mutateAsync(payload);
      toast.success('Perfil atualizado com sucesso!');
      reset({
        ...payload,
        password: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          placeholder="João da Silva"
          {...register('name')}
          disabled={updateMutation.isPending}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          placeholder="(11) 99999-9999"
          {...register('phone')}
          disabled={updateMutation.isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Nova Senha (deixe em branco para não alterar)</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          disabled={updateMutation.isPending}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          {...register('confirmPassword')}
          disabled={updateMutation.isPending}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={updateMutation.isPending}
        >
          Limpar
        </Button>
        <Button 
          type="submit" 
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Atualizando...' : 'Atualizar Perfil'}
        </Button>
      </div>
    </form>
  );
}

