# Project Reference

Este arquivo resume o entendimento atual do projeto com base no código do repositório. A intenção é servir como referência rápida para manutenção e evolução do backend.

## Estado Atual

- O repositório está focado no `backend/`.
- O backend é uma API NestJS com Prisma e PostgreSQL.
- O domínio principal é um sistema de agendamento multi-tenant.

## Objetivo do Produto

O sistema atende operações que precisam organizar:

- empresas isoladas por tenant;
- filiais por empresa;
- profissionais por filial;
- serviços executados por profissionais;
- clientes;
- agendamentos, bloqueios e métricas operacionais.

## Arquitetura Geral

- Framework: NestJS
- ORM: Prisma
- Banco: PostgreSQL
- Autenticação: JWT com refresh token
- Autorização: RBAC por papel e escopo de filial
- Documentação: Swagger
- Testes: Jest

## Módulos Principais

### Core

- `core/auth`: autenticação, login, signup, refresh, logout, convite e magic link
- `core/prisma`: acesso ao banco
- `core/email`: envio de emails
- `core/calendar`: geração de arquivos ICS
- `core/config`: validação de ambiente

### Domínios

- `tenants`: dados e atualização do tenant atual
- `filiais`: CRUD de filiais e configurações de agenda
- `users`: usuários internos e atribuição de papéis
- `customers`: cadastro e manutenção de clientes
- `professionals`: cadastro de profissionais, horários de trabalho e convites
- `services`: serviços, duração, buffer e vínculo com profissionais
- `scheduling`: cálculo de slots disponíveis
- `appointments`: criação, atualização, cancelamento e listagem de agendamentos
- `blocks`: bloqueios de agenda
- `metrics`: indicadores operacionais por filial
- `integrations/whatsapp`: criação de agendamento via integração externa

## Modelo de Negócio

As entidades mais importantes são:

- `Tenant`
- `User`
- `RoleAssignment`
- `Filial`
- `FilialSettings`
- `Professional`
- `WorkingPeriod`
- `BlockedTime`
- `Service`
- `ProfessionalService`
- `Customer`
- `Appointment`
- `AppointmentService`
- `AppointmentStatusHistory`
- `Invitation`
- `UserSession`

## Perfis de Acesso

Papéis atualmente modelados:

- `OWNER`
- `ADMIN`
- `MANAGER`
- `OPERATOR`
- `PROFESSIONAL`
- `ANALYST`
- `CUSTOMER`

## Funcionalidades Já Implementadas

### Tenant e autenticação

- criação de tenant com usuário owner;
- login com email e senha;
- refresh token;
- logout com revogação de sessão;
- leitura do usuário atual;
- aceite de convite para profissional;
- login de cliente por magic link.

### Filiais

- criar, listar, consultar, editar e remover filial;
- configurar granularidade dos slots por filial;
- listagem pública de filiais por tenant.

### Usuários e permissões

- criar usuários internos;
- listar usuários;
- consultar e editar usuário atual;
- atribuir e remover papéis.

### Profissionais

- criar, listar, consultar, editar e remover profissional;
- convidar profissional para criar conta;
- revogar convite pendente;
- cadastrar períodos de trabalho;
- remover períodos de trabalho.

### Serviços

- criar, listar, editar e remover serviço;
- vincular e desvincular profissionais a serviços;
- expor serviços ativos publicamente.

### Regras de serviço

Cada serviço suporta:

- `durationMinutes`: duração do atendimento;
- `bufferMinutes`: intervalo adicional entre atendimentos;
- `priceCents`: preço;
- `isActive`: ativação.

### Clientes

- criar, listar, consultar, editar e remover clientes.

### Agendamentos

- consultar slots disponíveis;
- criar agendamento público;
- criar agendamento interno;
- criar agendamento pelo portal do cliente;
- criar agendamento via integração WhatsApp;
- listar agendamentos administrativos;
- consultar agendamento por ID;
- atualizar agendamento;
- cancelar agendamento;
- listar agendamentos do cliente;
- listar histórico do cliente;
- listar agendamentos do profissional;
- cancelar agendamento pelo cliente;
- cancelar agendamento pelo profissional.

### Agenda e disponibilidade

O cálculo de disponibilidade considera:

- serviços escolhidos;
- soma de duração e buffer;
- granularidade configurada na filial;
- jornada do profissional;
- bloqueios;
- agendamentos já confirmados;
- escolha automática de profissional elegível com critério de distribuição.

### Métricas

Por filial, o sistema já calcula:

- resumo;
- série temporal;
- performance;
- mix de serviços;
- heatmap.

### Calendário

- feed ICS público por profissional;
- evento ICS público por agendamento.

## O Que Não Está Implementado

- recorrência real de agendamentos;
- regras do tipo semanal, mensal ou por série;
- modelagem explícita de série recorrente no banco;
- filtro público de serviços por profissional ainda está com `TODO`.

## Observações Técnicas

- O backend usa slug do tenant em várias rotas públicas.
- O sistema mistura fluxos públicos, administrativos, profissionais e clientes na mesma API.
- Há uso de guards globais e específicos para autenticação, papel e escopo.
- O código de appointments concentra parte importante da lógica de negócio.

## Arquivos-Chave Para Entender o Projeto

- `backend/prisma/schema.prisma`
- `backend/src/app.module.ts`
- `backend/src/core/auth/auth.service.ts`
- `backend/src/domains/appointments/appointments.controller.ts`
- `backend/src/domains/appointments/appointments.service.ts`
- `backend/src/domains/scheduling/scheduling.service.ts`
- `backend/src/domains/metrics/metrics.service.ts`

## Limites Deste Documento

Este arquivo é uma referência operacional, não uma fonte normativa. Em caso de divergência, o código vale mais do que este resumo.
