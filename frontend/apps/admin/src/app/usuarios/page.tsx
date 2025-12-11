'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  useUsers,
  useRemoveRole,
  useUpdateUser,
  useDeleteUser,
  useFiliais,
  type User,
  Role,
} from '@proagenda/api-client';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Badge,
} from '@proagenda/ui';
import { Plus, Shield, Trash2, Pencil } from 'lucide-react';
import { UserForm } from '@/components/usuarios/user-form';
import { AssignRoleDialog } from '@/components/usuarios/assign-role-dialog';
import { DataTable, Column } from '@/components/common/data-table';
import { FiltersBar, TextFilter } from '@/components/common/filters-bar';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { toast } from 'sonner';

const ROLE_COLORS: Record<Role, 'default' | 'secondary' | 'destructive'> = {
  [Role.OWNER]: 'destructive',
  [Role.ADMIN]: 'default',
  [Role.MANAGER]: 'default',
  [Role.OPERATOR]: 'secondary',
  [Role.PROFESSIONAL]: 'secondary',
  [Role.ANALYST]: 'secondary',
  [Role.CUSTOMER]: 'secondary',
};

const ROLE_LABELS: Record<Role, string> = {
  [Role.OWNER]: 'Owner',
  [Role.ADMIN]: 'Admin',
  [Role.MANAGER]: 'Gerente',
  [Role.OPERATOR]: 'Operador',
  [Role.PROFESSIONAL]: 'Profissional',
  [Role.ANALYST]: 'Analista',
  [Role.CUSTOMER]: 'Cliente',
};

export default function UsuariosPage() {
  const { data: filiais } = useFiliais();
  const [nameFilter, setNameFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [assignRoleUser, setAssignRoleUser] = useState<User | null>(null);
  const [removingRole, setRemovingRole] = useState<{ user: User; roleId: string; roleName: string } | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const { data: users, isLoading } = useUsers();
  const removeRoleMutation = useRemoveRole();
  const deleteUserMutation = useDeleteUser();

  // Aplicar filtros
  const filteredData = useMemo(() => {
    if (!users) return [];

    return users.filter((user: User) => {
      const matchesName = !nameFilter || user.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesRole =
        roleFilter === 'all' ||
        user.roles?.some((r: any) => r.role === roleFilter);

      return matchesName && matchesRole;
    });
  }, [users, nameFilter, roleFilter]);

  // Paginação
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleRemoveRole = async () => {
    if (!removingRole) return;

    try {
      await removeRoleMutation.mutateAsync({
        userId: removingRole.user.id,
        roleId: removingRole.roleId,
      });
      toast.success('Permissão removida com sucesso');
      setRemovingRole(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao remover permissão');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      await deleteUserMutation.mutateAsync(deletingUser.id);
      toast.success('Usuário excluído com sucesso');
      setDeletingUser(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir usuário');
    }
  };

  const clearFilters = () => {
    setNameFilter('');
    setRoleFilter('all');
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Usuário',
      sortable: true,
      render: (user) => (
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'roles',
      label: 'Permissões',
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user?.roles?.length === 0 ? (
            <span className="text-sm text-muted-foreground">Sem permissões</span>
          ) : (
            user?.roles?.map((roleAssignment) => (
              <div key={roleAssignment.id} className="flex items-center gap-1">
                <Badge variant={ROLE_COLORS[roleAssignment.role]}>
                  {ROLE_LABELS[roleAssignment.role]}
                  {roleAssignment.filial && ` - ${roleAssignment.filial.name}`}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() =>
                    setRemovingRole({
                      user,
                      roleId: roleAssignment.id,
                      roleName: ROLE_LABELS[roleAssignment.role],
                    })
                  }
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Telefone',
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {user.phone || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'text-right',
      render: (user) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingUser(user)}
            title="Editar usuário"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAssignRoleUser(user)}
          >
            <Shield className="h-4 w-4 mr-2" />
            Atribuir Permissão
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeletingUser(user)}
            disabled={deleteUserMutation.isPending}
            title="Excluir usuário"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Usuários</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie usuários e permissões do sistema
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Usuário</DialogTitle>
                <DialogDescription>Adicione um novo usuário ao sistema</DialogDescription>
              </DialogHeader>
              <UserForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <FiltersBar
          filters={[
            {
              id: 'name',
              label: 'Nome',
              component: (
                <TextFilter
                  id="name"
                  value={nameFilter}
                  onChange={(val) => {
                    setNameFilter(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Buscar por nome..."
                />
              ),
            },
            {
              id: 'role',
              label: 'Permissão',
              component: (
                <select
                  className="w-full h-9 px-3 rounded-md border border-input bg-background"
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">Todas</option>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              ),
            },
          ]}
          onClear={clearFilters}
        />

        {/* Tabela */}
        <DataTable
          data={paginatedData}
          columns={columns}
          isLoading={isLoading}
          getRowKey={(user) => user.id}
          emptyState={{
            title: 'Nenhum usuário encontrado',
            description: 'Comece adicionando seu primeiro usuário',
            action: {
              label: 'Novo Usuário',
              onClick: () => setIsCreateOpen(true),
            },
          }}
          pagination={{
            currentPage,
            totalPages,
            pageSize,
            totalItems: filteredData.length,
            onPageChange: setCurrentPage,
          }}
        />
      </div>

      {/* Modal Atribuir Permissão */}
      {assignRoleUser && (
        <AssignRoleDialog
          open={!!assignRoleUser}
          onOpenChange={() => setAssignRoleUser(null)}
          user={assignRoleUser}
        />
      )}

      {/* Modal de Edição */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize as informações do usuário
              </DialogDescription>
            </DialogHeader>
            <UserForm 
              user={editingUser} 
              onSuccess={() => setEditingUser(null)} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Remove Role */}
      {removingRole && (
        <ConfirmDialog
          open={!!removingRole}
          onOpenChange={() => setRemovingRole(null)}
          title="Remover Permissão"
          description={`Tem certeza que deseja remover a permissão "${removingRole.roleName}" de ${removingRole.user.name}?`}
          confirmLabel="Remover"
          variant="destructive"
          onConfirm={handleRemoveRole}
          isLoading={removeRoleMutation.isPending}
        />
      )}

      {/* Confirm Delete User */}
      {deletingUser && (
        <ConfirmDialog
          open={!!deletingUser}
          onOpenChange={() => setDeletingUser(null)}
          title="Excluir Usuário"
          description={`Tem certeza que deseja excluir o usuário "${deletingUser.name}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          variant="destructive"
          onConfirm={handleDeleteUser}
          isLoading={deleteUserMutation.isPending}
        />
      )}
    </DashboardLayout>
  );
}

