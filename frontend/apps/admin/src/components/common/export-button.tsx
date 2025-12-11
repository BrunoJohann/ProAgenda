'use client';

import { Button } from '@proagenda/ui';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  data: any[];
  filename: string;
  columns?: { key: string; label: string }[];
  disabled?: boolean;
}

export function ExportButton({
  data,
  filename,
  columns,
  disabled = false,
}: ExportButtonProps) {
  const handleExport = () => {
    try {
      if (!data || data.length === 0) {
        toast.error('Não há dados para exportar');
        return;
      }

      // Se não houver colunas definidas, usar todas as chaves do primeiro item
      const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));

      // Criar CSV
      const headers = cols.map((col) => col.label).join(',');
      const rows = data.map((item) =>
        cols.map((col) => {
          const value = item[col.key];
          // Escapar vírgulas e aspas
          const stringValue = String(value ?? '');
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      );

      const csv = [headers, ...rows].join('\n');

      // Criar blob e download
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Arquivo exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar arquivo');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      Exportar CSV
    </Button>
  );
}







