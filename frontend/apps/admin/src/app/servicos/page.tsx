'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  useFiliais,
  useServices,
  useUpdateService,
  useDeleteService,
  type Service,
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
import { Plus, Pencil, Trash2, Users, Power, PowerOff } from 'lucide-react';
import { ServiceForm } from '@/components/servicos/service-form';
import { LinkProfessionalsDialog } from '@/components/servicos/link-professionals-dialog';
import { DataTable, Column } from '@/components/common/data-table';
import { FiltersBar } from '@/components/common/filters-bar';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { toast } from 'sonner';

export default function ServicosPage() {
  const { data: filiais } = useFiliais();
  const [selectedFilialId, setSelectedFilialId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [linkingService, setLinkingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  const { data: services, isLoading } = useServices(selectedFilialId || filiais?.[0]?.id);
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();

  // Aplicar filtros
  const filteredData = useMemo(() => {
    if (!services) return [];

    return services.filter((service) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && service.isActive) ||
        (statusFilter === 'inactive' && !service.isActive);

      return matchesStatus;
    });
  }, [services, statusFilter]);

  // Paginação
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleToggleStatus = async (service: Service) => {
    try {
      await updateMutation.mutateAsync({
        filialId: service.filialId,
        id: service.id,
        data: { isActive: !service.isActive },
      });
      toast.success(
        service.isActive
          ? 'Serviço desativado com sucesso'
          : 'Serviço ativado com sucesso'
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar status');
    }
  };

  const handleDelete = async () => {
    if (!deletingService) return;

    try {
      await deleteMutation.mutateAsync({
        filialId: deletingService.filialId,
        id: deletingService.id,
      });
      toast.success('Serviço excluído com sucesso');
      setDeletingService(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir serviço');
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const clearFilters = () => {
    setStatusFilter('all');
  };

  const columns: Column<Service>[] = [
    {
      key: 'name',
      label: 'Nome',
      sortable: true,
      render: (service) => <div className="font-medium">{service.name}</div>,
    },
    {
      key: 'filial',
      label: 'Filial',
      render: (service) => (
        <Badge variant="secondary">
          {filiais?.find((f) => f.id === service.filialId)?.name || '-'}
        </Badge>
      ),
    },
    {
      key: 'duration',
      label: 'Duração',
      render: (service) => (
        <span className="text-sm">
          {service.durationMinutes} min
          {service.bufferMinutes > 0 && (
            <span className="text-muted-foreground"> (+{service.bufferMinutes} buffer)</span>
          )}
        </span>
      ),
    },
    {
      key: 'price',
      label: 'Preço',
      sortable: true,
      render: (service) => (
        <span className="font-medium">{formatPrice(service.priceCents)}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (service) => (
        <Badge variant={service.isActive ? 'default' : 'secondary'}>
          {service.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'text-right',
      render: (service) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingService(service)}
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleStatus(service)}
            title={service.isActive ? 'Desativar' : 'Ativar'}
            disabled={updateMutation.isPending}
          >
            {service.isActive ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLinkingService(service)}
            title="Vincular Profissionais"
          >
            <Users className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeletingService(service)}
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
            <h1 className="text-3xl font-bold">Serviços</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os serviços oferecidos pela empresa
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!effectiveFilialId}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Serviço</DialogTitle>
                <DialogDescription>Adicione um novo serviço ao sistema</DialogDescription>
              </DialogHeader>
              <ServiceForm
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
          getRowKey={(service) => service.id}
          emptyState={{
            title: 'Nenhum serviço encontrado',
            description: 'Comece adicionando seu primeiro serviço',
            action: {
              label: 'Novo Serviço',
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
      {editingService && (
        <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Serviço</DialogTitle>
              <DialogDescription>Atualize as informações do serviço</DialogDescription>
            </DialogHeader>
            <ServiceForm
              filialId={editingService.filialId}
              service={editingService}
              onSuccess={() => setEditingService(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Vincular Profissionais */}
      {linkingService && (
        <LinkProfessionalsDialog
          open={!!linkingService}
          onOpenChange={() => setLinkingService(null)}
          service={linkingService}
        />
      )}

      {/* Confirm Delete */}
      {deletingService && (
        <ConfirmDialog
          open={!!deletingService}
          onOpenChange={() => setDeletingService(null)}
          title="Excluir Serviço"
          description={`Tem certeza que deseja excluir "${deletingService.name}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          variant="destructive"
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      )}
    </DashboardLayout>
  );
}



