'use client';

import Link from 'next/link';
import { Button } from '@proagenda/ui';
import { Calendar, Users, TrendingUp, Clock, CheckCircle2, Star } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ProAgenda</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Recursos
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Preços
            </Link>
            <Link href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contato
            </Link>
            <Button asChild>
              <Link href="http://localhost:3000/login">Entrar</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-blue-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Simplifique Seus
              <span className="text-primary"> Agendamentos</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Sistema completo de gestão de agendamentos para sua empresa. 
              Controle profissionais, serviços e clientes em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="http://localhost:3000/login">Começar Grátis</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="http://localhost:3003">Ver Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-32">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Recursos Principais</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar seus agendamentos de forma eficiente
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Agendamento Inteligente</h3>
              <p className="text-muted-foreground">
                Sistema inteligente de slots que evita conflitos e otimiza a ocupação
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Multi-tenant</h3>
              <p className="text-muted-foreground">
                Suporte para múltiplas empresas e filiais em uma única plataforma
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Métricas e Relatórios</h3>
              <p className="text-muted-foreground">
                Dashboards completos com taxa de ocupação, receita e performance
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Gestão de Horários</h3>
              <p className="text-muted-foreground">
                Configure períodos de trabalho e bloqueios de forma flexível
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Controle de Acesso</h3>
              <p className="text-muted-foreground">
                Sistema completo de roles e permissões para sua equipe
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Interface Moderna</h3>
              <p className="text-muted-foreground">
                Design limpo e intuitivo para facilitar o uso diário
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32 bg-primary text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pronto para começar?
            </h2>
            <p className="text-xl opacity-90">
              Crie sua conta gratuitamente e comece a organizar seus agendamentos hoje mesmo
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="http://localhost:3000/login">Começar Agora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold">ProAgenda</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 ProAgenda. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

