'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
} from '@proagenda/ui';
import { useAssignRole, useFiliais, type User, Role } from '@proagenda/api-client';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

interface AssignRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

const ROLE_OPTIONS = [
  { value: Role.OWNER, label: 'Owner', description: 'Acesso total ao sistema', needsFilial: false },
  { value: Role.ADMIN, label: 'Admin', description: 'Administrador de filial', needsFilial: true },
  { value: Role.MANAGER, label: 'Manager', description: 'Gerente de filial', needsFilial: true },
  { value: Role.OPERATOR, label: 'Operator', description: 'Operador de filial', needsFilial: true },
  { value: Role.PROFESSIONAL, label: 'Professional', description: 'Profissional', needsFilial: true },
  { value: Role.ANALYST, label: 'Analyst', description: 'Analista', needsFilial: false },
];

export function AssignRoleDialog({ open, onOpenChange, user }: AssignRoleDialogProps) {
  const { data: filiais } = useFiliais();
  const assignMutation = useAssignRole();
  
  const [selectedRole, setSelectedRole] = useState<Role>(Role.OPERATOR);
  const [selectedFilialId, setSelectedFilialId] = useState<string>('');

  const roleOption = ROLE_OPTIONS.find((r) => r.value === selectedRole);

  const handleAssign = async () => {
    try {
      await assignMutation.mutateAsync({
        userId: user.id,
        data: {
          role: selectedRole,
          filialId: roleOption?.needsFilial ? selectedFilialId || undefined : undefined,
        },
      });
      toast.success('Permissão atribuída com sucesso!');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atribuir permissão');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Atribuir Permissão
          </DialogTitle>
          <DialogDescription>
            Adicione uma nova permissão para {user.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Permissão</Label>
            <select
              className="w-full h-9 px-3 rounded-md border border-input bg-background"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label} - {role.description}
                </option>
              ))}
            </select>
          </div>

          {roleOption?.needsFilial && (
            <div className="space-y-2">
              <Label>Filial *</Label>
              <select
                className="w-full h-9 px-3 rounded-md border border-input bg-background"
                value={selectedFilialId}
                onChange={(e) => setSelectedFilialId(e.target.value)}
              >
                <option value="">Selecione uma filial</option>
                {filiais?.map((filial) => (
                  <option key={filial.id} value={filial.id}>
                    {filial.name}
                  </option>
                ))}
              </select>
              {!selectedFilialId && (
                <p className="text-sm text-destructive">
                  Este tipo de permissão requer uma filial
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assignMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={
                assignMutation.isPending ||
                (roleOption?.needsFilial && !selectedFilialId)
              }
            >
              {assignMutation.isPending ? 'Atribuindo...' : 'Atribuir'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


