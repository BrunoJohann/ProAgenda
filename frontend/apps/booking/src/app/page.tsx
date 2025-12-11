'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label } from '@proagenda/ui';
import { Calendar, Search } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [tenantSlug, setTenantSlug] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tenantSlug.trim()) {
      router.push(`/${tenantSlug}/agendar`);
    }
  };

  // Exemplos de tenants populares
  const popularTenants = [
    { slug: 'acme', name: 'Acme Barbearia' },
    { slug: 'centro', name: 'Centro Estética' },
    { slug: 'spa', name: 'Spa & Beleza' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Calendar className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold">ProAgenda</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Agende seus serviços online de forma rápida e fácil
          </p>
        </div>

        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle>Encontre sua empresa</CardTitle>
            <CardDescription>
              Digite o nome ou código da empresa para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenant">Empresa</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="tenant"
                    placeholder="Ex: acme, salao-beleza, clinica-abc"
                    value={tenantSlug}
                    onChange={(e) => setTenantSlug(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg">
                Continuar para Agendamento
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Popular Tenants */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-center text-muted-foreground">
            Empresas populares:
          </p>
          <div className="grid grid-cols-3 gap-4">
            {popularTenants.map((tenant) => (
              <Button
                key={tenant.slug}
                variant="outline"
                className="h-auto py-4 flex-col"
                onClick={() => router.push(`/${tenant.slug}/agendar`)}
              >
                <span className="font-semibold">{tenant.name}</span>
                <span className="text-xs text-muted-foreground">{tenant.slug}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

