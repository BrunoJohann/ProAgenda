'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useFiliais, useCreateFilial, useDeleteFilial, type Filial } from '@proagenda/api-client';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Skeleton,
} from '@proagenda/ui';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { FilialForm } from '@/components/filiais/filial-form';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { toast } from 'sonner';

export default function FiliaisPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFilial, setEditingFilial] = useState<Filial | null>(null);
  const [deletingFilial, setDeletingFilial] = useState<Filial | null>(null);
  const { data: filiais, isLoading } = useFiliais();
  const createMutation = useCreateFilial();
  const deleteMutation = useDeleteFilial();

  const handleDelete = async () => {
    if (!deletingFilial) return;
    
    try {
      await deleteMutation.mutateAsync(deletingFilial.id);
      toast.success('Filial excluída com sucesso');
      setDeletingFilial(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir filial');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Filiais</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie as unidades da sua empresa
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Filial
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Filial</DialogTitle>
                <DialogDescription>
                  Adicione uma nova unidade ao sistema
                </DialogDescription>
              </DialogHeader>
              <FilialForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Todas as Filiais</CardTitle>
            <CardDescription>
              {filiais?.length || 0} filiais cadastradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filiais && filiais.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Timezone</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filiais.map((filial) => (
                    <TableRow key={filial.id}>
                      <TableCell className="font-medium">{filial.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{filial.slug}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {filial.timezone}
                      </TableCell>
                      <TableCell className="text-sm">
                        {filial.address ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {filial.address}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setEditingFilial(filial)}
                            title="Editar filial"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingFilial(filial)}
                            disabled={deleteMutation.isPending}
                            title="Excluir filial"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhuma filial cadastrada ainda
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeira filial
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Edição */}
      <Dialog open={!!editingFilial} onOpenChange={(open) => !open && setEditingFilial(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Filial</DialogTitle>
            <DialogDescription>
              Atualize as informações da filial
            </DialogDescription>
          </DialogHeader>
          {editingFilial && (
            <FilialForm 
              filial={editingFilial} 
              onSuccess={() => setEditingFilial(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        open={!!deletingFilial}
        onOpenChange={(open) => !open && setDeletingFilial(null)}
        title="Excluir Filial"
        description={
          deletingFilial
            ? `Tem certeza que deseja excluir a filial "${deletingFilial.name}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </DashboardLayout>
  );
}

