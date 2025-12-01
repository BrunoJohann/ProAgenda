'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useFiliais, useCreateFilial, useDeleteFilial } from '@proagenda/api-client';
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
  DialogFooter,
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
import { toast } from 'sonner';

export default function FiliaisPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: filiais, isLoading } = useFiliais();
  const createMutation = useCreateFilial();
  const deleteMutation = useDeleteFilial();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a filial "${name}"?`)) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Filial excluída com sucesso');
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
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(filial.id, filial.name)}
                            disabled={deleteMutation.isPending}
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
    </DashboardLayout>
  );
}

