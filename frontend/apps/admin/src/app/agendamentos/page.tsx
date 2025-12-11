'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  useFiliais,
  useProfessionals,
  useAppointments,
  useCancelAppointment,
} from '@proagenda/api-client';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@proagenda/ui';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { AppointmentCard } from '@/components/agendamentos/appointment-card';
import { AppointmentForm } from '@/components/agendamentos/appointment-form';
import { AppointmentDetailModal } from '@/components/agendamentos/appointment-detail-modal';
import { DateFilter } from '@/components/agendamentos/date-filter';
import { FiltersBar } from '@/components/common/filters-bar';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Skeleton } from '@proagenda/ui';
import { toast } from 'sonner';
import type { Appointment } from '@proagenda/api-client';
import { format, startOfDay, endOfDay } from 'date-fns';

export default function AgendamentosPage() {
  const { data: filiais } = useFiliais();
  const [selectedFilialId, setSelectedFilialId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [professionalFilter, setProfessionalFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);
  const [cancelingAppointment, setCancelingAppointment] = useState<Appointment | null>(null);

 const filialQueries = [
    useAppointments({
      filialId: filiais?.[0]?.id || '',
      professionalId: professionalFilter !== 'all' ? professionalFilter : undefined,
      from: format(startOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss"),
      to: format(endOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss"),
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    useAppointments({
      filialId: filiais?.[1]?.id || '',
      professionalId: professionalFilter !== 'all' ? professionalFilter : undefined,
      from: format(startOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss"),
      to: format(endOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss"),
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    useAppointments({
      filialId: filiais?.[2]?.id || '',
      professionalId: professionalFilter !== 'all' ? professionalFilter : undefined,
      from: format(startOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss"),
      to: format(endOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss"),
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    useAppointments({
      filialId: filiais?.[3]?.id || '',
      professionalId: professionalFilter !== 'all' ? professionalFilter : undefined,
      from: format(startOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss"),
      to: format(endOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss"),
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    useAppointments({
      filialId: filiais?.[4]?.id || '',
      professionalId: professionalFilter !== 'all' ? professionalFilter : undefined,
      from: format(startOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss"),
      to: format(endOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss"),
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  ];

  const effectiveFilialId = selectedFilialId === 'all' ? filiais?.[0]?.id || '' : selectedFilialId;
  const { data: professionals } = useProfessionals(effectiveFilialId);

  // Buscar appointments da API com filtros
  const { data: appointments, isLoading } = useAppointments({
    filialId: effectiveFilialId,
    professionalId: professionalFilter !== 'all' ? professionalFilter : undefined,
    from: format(startOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss"),
    to: format(endOfDay(selectedDate), "yyyy-MM-dd'T'HH:mm:ss"),
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const allAppointments = useMemo(() => {
    if (selectedFilialId !== 'all') {
      return appointments || [];
    }

    return filialQueries.flatMap((query) => query.data || []);
  }, [selectedFilialId, appointments, ...filialQueries.map((q) => q.data)]);

  const isLoadingAll = selectedFilialId === 'all' 
    ? filialQueries.some((q) => q.isLoading)
    : isLoading;

  const cancelMutation = useCancelAppointment();

  // Aplicar filtros
  const filteredAppointments = useMemo(() => {
    if (!allAppointments || allAppointments.length === 0) return [];

    return allAppointments.filter((apt: Appointment) => {
      const matchesProfessional =
        professionalFilter === 'all' || apt.professionalId === professionalFilter;
      const matchesStatus =
        statusFilter === 'all' || apt.status === statusFilter;

      return matchesProfessional && matchesStatus;
    });
  }, [allAppointments, professionalFilter, statusFilter]);

  // Ordenar por horário
  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
  }, [filteredAppointments]);

  const handleCancelAppointment = async () => {
    if (!cancelingAppointment) return;

    try {
      await cancelMutation.mutateAsync({
        id: cancelingAppointment.id,
        data: { reason: 'Cancelado pelo admin' },
      });
      toast.success('Agendamento cancelado com sucesso');
      setCancelingAppointment(null);
      setDetailAppointment(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao cancelar agendamento');
    }
  };

  const clearFilters = () => {
    setSelectedFilialId('all');
    setProfessionalFilter('all');
    setStatusFilter('all');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agendamentos</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os agendamentos do sistema
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!effectiveFilialId}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Agendamento</DialogTitle>
                <DialogDescription>
                  Crie um novo agendamento manualmente
                </DialogDescription>
              </DialogHeader>
              <AppointmentForm
                filialId={effectiveFilialId}
                onSuccess={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtro de Data */}
        <div className="flex justify-center">
          <DateFilter selectedDate={selectedDate} onDateChange={setSelectedDate} />
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
                  onChange={(e) => setSelectedFilialId(e.target.value)}
                >
                  <option value="all">Todos</option>
                  {filiais?.map((filial: { id: string; name: string }) => (
                    <option key={filial.id} value={filial.id}>
                      {filial.name}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              id: 'professional',
              label: 'Profissional',
              component: (
                <select
                  className="w-full h-9 px-3 rounded-md border border-input bg-background"
                  value={professionalFilter}
                  onChange={(e) => setProfessionalFilter(e.target.value)}
                >
                  <option value="all">Todos</option>
                  {professionals?.filter(p => p.isActive).map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.name}
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
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="CONFIRMED">Confirmados</option>
                  <option value="CANCELED">Cancelados</option>
                </select>
              ),
            },
          ]}
          onClear={clearFilters}
        />

        {/* Lista de Agendamentos */}
        <div className="space-y-4">
          {isLoadingAll ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : sortedAppointments.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon className="h-12 w-12" />}
              title="Nenhum agendamento encontrado"
              description="Não há agendamentos para esta data e filtros selecionados"
              action={{
                label: 'Novo Agendamento',
                onClick: () => setIsCreateOpen(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onClick={() => setDetailAppointment(appointment)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalhes */}
      {detailAppointment && (
        <AppointmentDetailModal
          open={!!detailAppointment}
          onOpenChange={() => setDetailAppointment(null)}
          appointment={detailAppointment}
          onEdit={() => {
            setEditingAppointment(detailAppointment);
            setDetailAppointment(null);
          }}
          onCancel={() => {
            setCancelingAppointment(detailAppointment);
          }}
        />
      )}

      {/* Modal Edição */}
      {editingAppointment && (
        <Dialog open={!!editingAppointment} onOpenChange={(open) => {
          if (!open) {
            setEditingAppointment(null);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Agendamento</DialogTitle>
              <DialogDescription>
                Atualize as informações do agendamento
              </DialogDescription>
            </DialogHeader>
            <AppointmentForm
              filialId={effectiveFilialId}
              appointment={editingAppointment}
              onSuccess={() => {
                setEditingAppointment(null);
                setDetailAppointment(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Cancel */}
      {cancelingAppointment && (
        <ConfirmDialog
          open={!!cancelingAppointment}
          onOpenChange={() => setCancelingAppointment(null)}
          title="Cancelar Agendamento"
          description={`Tem certeza que deseja cancelar o agendamento de ${cancelingAppointment.customerName}?`}
          confirmLabel="Cancelar Agendamento"
          variant="destructive"
          onConfirm={handleCancelAppointment}
        />
      )}
    </DashboardLayout>
  );
}

