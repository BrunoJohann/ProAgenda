import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ProAgenda - Sistema de Agendamento Inteligente',
  description:
    'Simplifique seu negócio com agendamentos online, gestão de profissionais e relatórios completos',
  keywords: ['agendamento', 'agenda online', 'gestão', 'profissionais'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

