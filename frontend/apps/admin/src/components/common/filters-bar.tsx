'use client';

import { ReactNode } from 'react';
import { Input, Label, Button } from '@proagenda/ui';
import { X } from 'lucide-react';

interface FilterItem {
  id: string;
  label: string;
  component: ReactNode;
}

interface FiltersBarProps {
  filters: FilterItem[];
  onClear?: () => void;
  showClearButton?: boolean;
}

export function FiltersBar({ filters, onClear, showClearButton = true }: FiltersBarProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filtros</h3>
        {showClearButton && onClear && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-2" />
            Limpar filtros
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filters.map((filter) => (
          <div key={filter.id} className="space-y-2">
            <Label htmlFor={filter.id}>{filter.label}</Label>
            {filter.component}
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente auxiliar para filtro de texto
interface TextFilterProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TextFilter({ id, value, onChange, placeholder }: TextFilterProps) {
  return (
    <Input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}







