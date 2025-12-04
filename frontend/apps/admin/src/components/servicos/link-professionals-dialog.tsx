'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Checkbox,
} from '@proagenda/ui';
import {
  useProfessionals,
  useLinkProfessionalToService,
  useUnlinkProfessionalFromService,
  type Service,
} from '@proagenda/api-client';
import { Users } from 'lucide-react';
import { toast } from 'sonner';

interface LinkProfessionalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
}

export function LinkProfessionalsDialog({
  open,
  onOpenChange,
  service,
}: LinkProfessionalsDialogProps) {
  const { data: professionals, isLoading } = useProfessionals(service.filialId);
  const linkMutation = useLinkProfessionalToService();
  const unlinkMutation = useUnlinkProfessionalFromService();

  const handleToggle = async (professionalId: string, isLinked: boolean) => {
    try {
      if (isLinked) {
        await unlinkMutation.mutateAsync({
          filialId: service.filialId,
          serviceId: service.id,
          professionalId,
        });
        toast.success('Profissional removido do serviço');
      } else {
        await linkMutation.mutateAsync({
          filialId: service.filialId,
          serviceId: service.id,
          professionalId,
        });
        toast.success('Profissional vinculado ao serviço');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar vínculo');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Vincular Profissionais
          </DialogTitle>
          <DialogDescription>
            Selecione quais profissionais podem executar o serviço "{service.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando profissionais...</p>
          ) : !professionals || professionals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum profissional cadastrado nesta filial
            </p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {professionals.map((professional) => {
                // Nota: A API não retorna os vínculos diretamente no serviço
                // Em uma implementação real, você precisaria buscar essa informação
                // Por ora, vamos considerar que a propriedade existe ou criar um estado local
                const isLinked = false; // TODO: Implementar lógica de verificação

                return (
                  <div
                    key={professional.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{professional.name}</div>
                      {professional.specialties && (
                        <div className="text-sm text-muted-foreground">
                          {professional.specialties}
                        </div>
                      )}
                    </div>
                    <Checkbox
                      checked={isLinked}
                      onCheckedChange={() => handleToggle(professional.id, isLinked)}
                      disabled={linkMutation.isPending || unlinkMutation.isPending}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}



