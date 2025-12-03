'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  useCustomers,
  useDeleteCustomer,
  useFiliais,
  type Customer,
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
  Avatar,
  AvatarFallback,
} from '@proagenda/ui';
import { Plus, Pencil, Trash2, History, Download } from 'lucide-react';
import { CustomerForm } from '@/components/clientes/customer-form';
import { CustomerHistoryModal } from '@/components/clientes/customer-history-modal';
import { DataTable, Column } from '@/components/common/data-table';
import { FiltersBar, TextFilter } from '@/components/common/filters-bar';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ExportButton } from '@/components/common/export-button';
import { toast } from 'sonner';

export default function ClientesPage() {
  const { data: filiais } = useFiliais();
  const [selectedFilialId, setSelectedFilialId] = useState<string>('all');
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  const { data: customers, isLoading } = useCustomers(
    selectedFilialId !== 'all' ? selectedFilialId : undefined
  );
  const deleteMutation = useDeleteCustomer();

  // Aplicar filtros
  const filteredData = useMemo(() => {
    if (!customers) return [];

    return customers.filter((customer) => {
      const matchesName = !nameFilter || customer.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesEmail = !emailFilter || customer.email?.toLowerCase().includes(emailFilter.toLowerCase());

      return matchesName && matchesEmail;
    });
  }, [customers, nameFilter, emailFilter]);

  // Paginação
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleDelete = async () => {
    if (!deletingCustomer) return;

    try {
      await deleteMutation.mutateAsync(deletingCustomer.id);
      toast.success('Cliente excluído com sucesso');
      setDeletingCustomer(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir cliente');
    }
  };

  const clearFilters = () => {
    setNameFilter('');
    setEmailFilter('');
    setSelectedFilialId('all');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      label: 'Cliente',
      sortable: true,
      render: (customer) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{customer.name}</div>
            {customer.email && (
              <div className="text-sm text-muted-foreground">{customer.email}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'document',
      label: 'Documento',
      render: (customer) => (
        <div className="text-sm">
          {customer.document ? (
            <>
              <div className="font-medium">{customer.document}</div>
              <div className="text-muted-foreground">{customer.documentType}</div>
            </>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'filial',
      label: 'Filial',
      render: (customer) => (
        customer.filialId ? (
          <Badge variant="secondary">
            {filiais?.find((f) => f.id === customer.filialId)?.name || '-'}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'createdAt',
      label: 'Cadastro',
      sortable: true,
      render: (customer) => (
        <span className="text-sm text-muted-foreground">
          {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'text-right',
      render: (customer) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHistoryCustomer(customer)}
            title="Histórico"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingCustomer(customer)}
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeletingCustomer(customer)}
            disabled={deleteMutation.isPending}
            title="Excluir"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const exportColumns = [
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'document', label: 'Documento' },
    { key: 'documentType', label: 'Tipo Documento' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os clientes cadastrados no sistema
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={filteredData}
              filename="clientes"
              columns={exportColumns}
            />
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Novo Cliente</DialogTitle>
                  <DialogDescription>Adicione um novo cliente ao sistema</DialogDescription>
                </DialogHeader>
                <CustomerForm onSuccess={() => setIsCreateOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
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
                  <option value="all">Todas</option>
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
              id: 'email',
              label: 'Email',
              component: (
                <TextFilter
                  id="email"
                  value={emailFilter}
                  onChange={(val) => {
                    setEmailFilter(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Buscar por email..."
                />
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
          getRowKey={(customer) => customer.id}
          emptyState={{
            title: 'Nenhum cliente encontrado',
            description: 'Comece adicionando seu primeiro cliente',
            action: {
              label: 'Novo Cliente',
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
      {editingCustomer && (
        <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>Atualize as informações do cliente</DialogDescription>
            </DialogHeader>
            <CustomerForm
              customer={editingCustomer}
              onSuccess={() => setEditingCustomer(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Histórico */}
      {historyCustomer && (
        <CustomerHistoryModal
          open={!!historyCustomer}
          onOpenChange={() => setHistoryCustomer(null)}
          customer={historyCustomer}
        />
      )}

      {/* Confirm Delete */}
      {deletingCustomer && (
        <ConfirmDialog
          open={!!deletingCustomer}
          onOpenChange={() => setDeletingCustomer(null)}
          title="Excluir Cliente"
          description={`Tem certeza que deseja excluir ${deletingCustomer.name}? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          variant="destructive"
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      )}
    </DashboardLayout>
  );
}


