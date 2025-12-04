'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  useFiliais,
  useProfessionals,
  useUpdateProfessional,
  useDeleteProfessional,
  type Professional,
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
  Input,
} from '@proagenda/ui';
import { Plus, Pencil, Trash2, Clock, Ban, Power, PowerOff } from 'lucide-react';
import { ProfessionalForm } from '@/components/profissionais/professional-form';
import { WorkingHoursModal } from '@/components/profissionais/working-hours-modal';
import { BlocksModal } from '@/components/profissionais/blocks-modal';
import { DataTable, Column } from '@/components/common/data-table';
import { FiltersBar, TextFilter } from '@/components/common/filters-bar';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { toast } from 'sonner';

export default function ProfissionaisPage() {
  const { data: filiais } = useFiliais();
  const [selectedFilialId, setSelectedFilialId] = useState<string>('');
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [workingHoursProfessional, setWorkingHoursProfessional] = useState<Professional | null>(null);
  const [blocksProfessional, setBlocksProfessional] = useState<Professional | null>(null);
  const [deletingProfessional, setDeletingProfessional] = useState<Professional | null>(null);

  const { data: professionals, isLoading } = useProfessionals(selectedFilialId || filiais?.[0]?.id);
  const updateMutation = useUpdateProfessional();
  const deleteMutation = useDeleteProfessional();

  // Aplicar filtros
  const filteredData = useMemo(() => {
    if (!professionals) return [];

    return professionals.filter((prof) => {
      const matchesName = !nameFilter || prof.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && prof.isActive) ||
        (statusFilter === 'inactive' && !prof.isActive);

      return matchesName && matchesStatus;
    });
  }, [professionals, nameFilter, statusFilter]);

  // Paginação
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleToggleStatus = async (professional: Professional) => {
    try {
      await updateMutation.mutateAsync({
        filialId: professional.filialId,
        id: professional.id,
        data: { isActive: !professional.isActive },
      });
      toast.success(
        professional.isActive
          ? 'Profissional desativado com sucesso'
          : 'Profissional ativado com sucesso'
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar status');
    }
  };

  const handleDelete = async () => {
    if (!deletingProfessional) return;

    try {
      await deleteMutation.mutateAsync({
        filialId: deletingProfessional.filialId,
        id: deletingProfessional.id,
      });
      toast.success('Profissional excluído com sucesso');
      setDeletingProfessional(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir profissional');
    }
  };

  const clearFilters = () => {
    setNameFilter('');
    setStatusFilter('all');
  };

  const columns: Column<Professional>[] = [
    {
      key: 'name',
      label: 'Nome',
      sortable: true,
      render: (prof) => (
        <div>
          <div className="font-medium">{prof.name}</div>
          {prof.specialties && (
            <div className="text-sm text-muted-foreground">{prof.specialties}</div>
          )}
        </div>
      ),
    },
    {
      key: 'filial',
      label: 'Filial',
      render: (prof) => (
        <Badge variant="secondary">
          {filiais?.find((f) => f.id === prof.filialId)?.name || '-'}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (prof) => (
        <Badge variant={prof.isActive ? 'default' : 'secondary'}>
          {prof.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'timezone',
      label: 'Timezone',
      render: (prof) => (
        <span className="text-sm text-muted-foreground">
          {prof.timezone || 'Padrão'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'text-right',
      render: (prof) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingProfessional(prof)}
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleStatus(prof)}
            title={prof.isActive ? 'Desativar' : 'Ativar'}
            disabled={updateMutation.isPending}
          >
            {prof.isActive ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setWorkingHoursProfessional(prof)}
            title="Horários"
          >
            <Clock className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setBlocksProfessional(prof)}
            title="Bloqueios"
          >
            <Ban className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeletingProfessional(prof)}
            disabled={deleteMutation.isPending}
            title="Excluir"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const effectiveFilialId = selectedFilialId || filiais?.[0]?.id || '';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profissionais</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os profissionais e seus horários
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!effectiveFilialId}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Profissional
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Profissional</DialogTitle>
                <DialogDescription>Adicione um novo profissional ao sistema</DialogDescription>
              </DialogHeader>
              <ProfessionalForm
                filialId={effectiveFilialId}
                onSuccess={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <FiltersBar
          filters={[
            {
              id: 'filial',
              label: 'Filial',
              component: (
                <select
                  className="w-full h-9 px-3 rounded-md border border-input bg-background"
                  value={selectedFilialId}
                  onChange={(e) => {
                    setSelectedFilialId(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  {filiais?.map((filial) => (
                    <option key={filial.id} value={filial.id}>
                      {filial.name}
                    </option>
                  ))}
                </select>
              ),
            },
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
              id: 'status',
              label: 'Status',
              component: (
                <select
                  className="w-full h-9 px-3 rounded-md border border-input bg-background"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
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
          getRowKey={(prof) => prof.id}
          emptyState={{
            title: 'Nenhum profissional encontrado',
            description: 'Comece adicionando seu primeiro profissional',
            action: {
              label: 'Novo Profissional',
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

      {/* Modal Editar */}
      {editingProfessional && (
        <Dialog open={!!editingProfessional} onOpenChange={() => setEditingProfessional(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Profissional</DialogTitle>
              <DialogDescription>Atualize as informações do profissional</DialogDescription>
            </DialogHeader>
            <ProfessionalForm
              filialId={editingProfessional.filialId}
              professional={editingProfessional}
              onSuccess={() => setEditingProfessional(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Horários */}
      {workingHoursProfessional && (
        <WorkingHoursModal
          open={!!workingHoursProfessional}
          onOpenChange={() => setWorkingHoursProfessional(null)}
          professional={workingHoursProfessional}
          filialId={workingHoursProfessional.filialId}
        />
      )}

      {/* Modal Bloqueios */}
      {blocksProfessional && (
        <BlocksModal
          open={!!blocksProfessional}
          onOpenChange={() => setBlocksProfessional(null)}
          professional={blocksProfessional}
        />
      )}

      {/* Confirm Delete */}
      {deletingProfessional && (
        <ConfirmDialog
          open={!!deletingProfessional}
          onOpenChange={() => setDeletingProfessional(null)}
          title="Excluir Profissional"
          description={`Tem certeza que deseja excluir ${deletingProfessional.name}? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          variant="destructive"
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      )}
    </DashboardLayout>
  );
}



