'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@proagenda/utils';
import { Calendar, History, Plus, LogOut, User } from 'lucide-react';
import { Button } from '@proagenda/ui';
import { useCustomerAuthStore } from '@/lib/store/customer-auth-store';
import { toast } from 'sonner';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CustomerSidebarProps {
  tenant: string;
}

export function CustomerSidebar({ tenant }: CustomerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useCustomerAuthStore();

  const items: SidebarItem[] = [
    {
      title: 'Agendamentos',
      href: `/${tenant}/meus-agendamentos`,
      icon: Calendar,
    },
    {
      title: 'Histórico',
      href: `/${tenant}/meus-agendamentos/historico`,
      icon: History,
    },
    {
      title: 'Novo Agendamento',
      href: `/${tenant}/meus-agendamentos/novo`,
      icon: Plus,
    },
  ];

  const handleLogout = () => {
    clearAuth();
    const { getApiClient } = require('@proagenda/api-client');
    getApiClient().clearAuth();
    router.push(`/${tenant}/login`);
    toast.success('Logout realizado com sucesso');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">ProAgenda</h2>
        <p className="text-sm text-gray-600 mt-1">Portal do Cliente</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            // Fix: Only mark as active if exact match
            // For "Agendamentos", only match exact path, not children
            let isActive = false;
            if (item.title === 'Agendamentos') {
              isActive = pathname === item.href;
            } else {
              // For other items, match exact or direct children
              isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            }
            
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 space-y-3">
        <div className="px-4 py-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">{user?.name}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}

