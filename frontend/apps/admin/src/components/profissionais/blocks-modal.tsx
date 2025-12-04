'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
} from '@proagenda/ui';
import { useBlocks, useCreateBlock, useDeleteBlock, type Professional } from '@proagenda/api-client';
import { Plus, Trash2, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlocksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professional: Professional;
}

export function BlocksModal({ open, onOpenChange, professional }: BlocksModalProps) {
  const { data: blocks, isLoading } = useBlocks(professional.id);
  const createMutation = useCreateBlock();
  const deleteMutation = useDeleteBlock();

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  const handleAdd = async () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const startsAt = `${startDate}T${startTime}:00`;
      const endsAt = `${endDate}T${endTime}:00`;

      await createMutation.mutateAsync({
        professionalId: professional.id,
        data: { startsAt, endsAt, reason: reason || undefined },
      });

      toast.success('Bloqueio criado com sucesso!');
      setStartDate('');
      setStartTime('');
      setEndDate('');
      setEndTime('');
      setReason('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar bloqueio');
    }
  };

  const handleDelete = async (blockId: string) => {
    try {
      await deleteMutation.mutateAsync({
        professionalId: professional.id,
        blockId,
      });
      toast.success('Bloqueio removido com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao remover bloqueio');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bloqueios de Agenda</DialogTitle>
          <DialogDescription>
            Configure períodos em que {professional.name} não estará disponível
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Adicionar bloqueio */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Bloqueio
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora Início</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora Fim</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Férias, treinamento, etc"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={createMutation.isPending}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Bloqueio
            </Button>
          </div>

          {/* Lista de bloqueios */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Bloqueios Cadastrados
            </h4>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : !blocks || blocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum bloqueio cadastrado
              </p>
            ) : (
              <div className="space-y-2">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-start justify-between border rounded-lg p-3"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {format(new Date(block.startsAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}{' '}
                        -{' '}
                        {format(new Date(block.endsAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                      {block.reason && (
                        <div className="text-sm text-muted-foreground">
                          {block.reason}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(block.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



