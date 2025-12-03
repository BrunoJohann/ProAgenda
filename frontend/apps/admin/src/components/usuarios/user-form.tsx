'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateUser, useUpdateUser, type User } from '@proagenda/api-client';
import { Button, Input, Label } from '@proagenda/ui';
import { toast } from 'sonner';

const createUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

const updateUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
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

type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;

interface UserFormProps {
  user?: User;
  onSuccess?: () => void;
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
  });

  // Preencher formulário quando estiver editando
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: CreateUserFormData | UpdateUserFormData) => {
    try {
      if (isEditing) {
        const { confirmPassword, ...payload } = data as UpdateUserFormData;
        // Remover password se estiver vazio
        if (!payload.password) {
          delete payload.password;
        }
        await updateMutation.mutateAsync({
          id: user.id,
          data: payload,
        });
        toast.success('Usuário atualizado com sucesso!');
      } else {
        const { confirmPassword, ...payload } = data as CreateUserFormData;
        await createMutation.mutateAsync(payload);
        toast.success('Usuário criado com sucesso!');
      }
      reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Erro ao ${isEditing ? 'atualizar' : 'criar'} usuário`);
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
          disabled={createMutation.isPending || updateMutation.isPending}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="joao@empresa.com"
          {...register('email')}
          disabled={createMutation.isPending || updateMutation.isPending || isEditing}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          placeholder="(11) 99999-9999"
          {...register('phone')}
          disabled={createMutation.isPending || updateMutation.isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha {isEditing ? '(deixe em branco para não alterar)' : '*'}</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          disabled={createMutation.isPending || updateMutation.isPending}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword')}
            disabled={createMutation.isPending}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
      )}

      {isEditing && (
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
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
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
            : (isEditing ? 'Atualizar Usuário' : 'Criar Usuário')}
        </Button>
      </div>
    </form>
  );
}

