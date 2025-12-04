'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCustomer, useUpdateCustomer, useFiliais, type Customer } from '@proagenda/api-client';
import { Button, Input, Label } from '@proagenda/ui';
import { toast } from 'sonner';

const customerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  document: z.string().optional(),
  documentType: z.string().optional(),
  filialId: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Customer;
  onSuccess?: () => void;
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const { data: filiais } = useFiliais();
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const isEditing = !!customer;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || {
      documentType: 'CPF',
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    try {
      // Limpar campos vazios
      const payload = {
        ...data,
        email: data.email || undefined,
        document: data.document || undefined,
        documentType: data.document ? data.documentType : undefined,
        filialId: data.filialId || undefined,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: customer.id, data: payload });
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Cliente criado com sucesso!');
        reset();
      }
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar cliente');
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="joao@email.com"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="documentType">Tipo de Documento</Label>
          <select
            id="documentType"
            className="w-full h-9 px-3 rounded-md border border-input bg-background"
            {...register('documentType')}
            disabled={isLoading}
          >
            <option value="CPF">CPF</option>
            <option value="CNPJ">CNPJ</option>
            <option value="RG">RG</option>
            <option value="PASSPORT">Passaporte</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="document">Número do Documento</Label>
          <Input
            id="document"
            placeholder="000.000.000-00"
            {...register('document')}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filialId">Filial (opcional)</Label>
        <select
          id="filialId"
          className="w-full h-9 px-3 rounded-md border border-input bg-background"
          {...register('filialId')}
          disabled={isLoading}
        >
          <option value="">Nenhuma</option>
          {filiais?.map((filial) => (
            <option key={filial.id} value={filial.id}>
              {filial.name}
            </option>
          ))}
        </select>
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



