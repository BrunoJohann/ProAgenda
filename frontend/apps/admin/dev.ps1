# Script para iniciar o servidor de desenvolvimento com permissões corretas
$ErrorActionPreference = "Stop"

Write-Host "Limpando processos Node..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Removendo pasta .next..." -ForegroundColor Yellow
if (Test-Path .next) {
    Remove-Item -Path .next -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host "Criando pasta .next com permissões..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path .next -Force | Out-Null
Start-Sleep -Seconds 1

# Tentar dar permissões à pasta
try {
    $username = $env:USERNAME
    icacls .next /grant "${username}:(OI)(CI)F" /T 2>&1 | Out-Null
    
    # Criar arquivo trace com permissões antes do Next.js tentar usá-lo
    $traceFile = ".next\trace"
    if (-not (Test-Path $traceFile)) {
        New-Item -ItemType File -Path $traceFile -Force | Out-Null
    }
    icacls $traceFile /grant "${username}:(F)" 2>&1 | Out-Null
    
    Write-Host "Permissões configuradas." -ForegroundColor Green
} catch {
    Write-Host "Aviso: Não foi possível configurar permissões automaticamente." -ForegroundColor Yellow
}

Write-Host "Iniciando servidor de desenvolvimento..." -ForegroundColor Green
$env:NEXT_TELEMETRY_DISABLED = "1"
$env:TRACE = ""
pnpm dev

