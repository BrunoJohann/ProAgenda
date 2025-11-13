<!-- e4541e53-f871-4ec5-9b1c-f180cfe62293 7dd53255-e5ca-40f5-babe-b98803a9e51d -->
# Observability Implementation Plan

## 1. Instrumentação do Aplicativo

- Integrar `@opentelemetry/sdk-node` e auto-instrumentação em `main.ts` para expor métricas e traces.
- Criar módulo `observability` com registradores de métricas customizadas (ex.: `appointments.created.count`) e middlewares NestJS para propagar `trace_id`/`span_id`.
- Ajustar `PrismaService` para instrumentação OTEL (usar `@prisma/instrumentation`) e garantir spans nas queries críticas.

## 2. Stack Local e Desenvolvimento

- Adicionar `docker-compose` em `[backend/observability/docker-compose.yaml](backend/observability/docker-compose.yaml)` com Prometheus, Grafana, Otel Collector e exporters necessários.
- Configurar `otel-collector-config.yaml` recebendo OTLP e exportando para Prometheus (métricas) + logs stdout para depuração.
- Criar dashboards Grafana (`backend/observability/dashboards/*.json`) para HTTP, Prisma e métricas customizadas; documentar uso em `docs/observability.md`.

## 3. Produção em EC2 (self-managed)

- Definir script/terraform para provisionar Prometheus + Grafana em EC2 (ou usar Amazon Managed Service for Prometheus/Grafana como passo seguinte).
- Descrever configuração do Otel Collector lado aplicação (systemd/docker) apontando para Prometheus remoto e storage de traces (Tempo ou S3 via Loki-stack opcional).
- Implementar alertas via Alertmanager (ou Grafana Alerting) com SLOs: p95 < 400 ms em `POST /appointments`, taxa de erro <1%, saturação de DB.

## 4. Operação Contínua

- Documentar processos de sanity-check (benchmarks k6 + validação de dashboards), rotação de tokens, gerenciamento de secrets/SSL.
- Planejar evolução para Lambda caso migre para serverless (Collector como sidecar/extension) mantendo a mesma instrumentação OTEL.

### To-dos

- [ ] Adicionar SDK OpenTelemetry, auto-instrumentação e métricas customizadas no NestJS
- [ ] Configurar docker-compose local com Prometheus, Grafana e Otel Collector, mais dashboards base
- [ ] Planejar e documentar deploy do collector e Prometheus/Grafana em EC2 com alertas
- [ ] Produzir documentação de operação, testes de verificação e roadmap para futuras migrações (ex.: Lambda)