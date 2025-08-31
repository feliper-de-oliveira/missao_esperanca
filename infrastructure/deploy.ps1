# PowerShell deployment script for Windows
# AWS Infrastructure Setup for "Quero Conhecer Jesus"

param(
    [string]$Region = "us-east-1",
    [string]$Stage = "dev",
    [string]$JwtSecret = ""
)

Write-Host "🚀 Iniciando setup da infraestrutura AWS..." -ForegroundColor Green

# Check if AWS CLI is installed
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI não encontrado. Por favor, instale o AWS CLI primeiro." -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Generate JWT secret if not provided
if ([string]::IsNullOrEmpty($JwtSecret)) {
    $JwtSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
}

Write-Host "📋 Configurações:" -ForegroundColor Yellow
Write-Host "  - Região AWS: $Region" -ForegroundColor White
Write-Host "  - Stage: $Stage" -ForegroundColor White
Write-Host "  - JWT Secret: [HIDDEN]" -ForegroundColor White

# Set environment variables
$env:AWS_REGION = $Region
$env:STAGE = $Stage
$env:JWT_SECRET = $JwtSecret

Write-Host "📊 Criando tabelas DynamoDB..." -ForegroundColor Blue

# Create Artefatos table
try {
    aws dynamodb create-table `
        --table-name "quero-conhecer-jesus-artefatos-$Stage" `
        --attribute-definitions AttributeName=tokenId,AttributeType=S `
        --key-schema AttributeName=tokenId,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region $Region `
        --no-cli-pager
    Write-Host "✅ Tabela Artefatos criada" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Tabela Artefatos já existe ou erro na criação" -ForegroundColor Yellow
}

# Create Logs table
try {
    aws dynamodb create-table `
        --table-name "quero-conhecer-jesus-logs-$Stage" `
        --attribute-definitions AttributeName=id,AttributeType=S AttributeName=timestamp,AttributeType=N `
        --key-schema AttributeName=id,KeyType=HASH AttributeName=timestamp,KeyType=RANGE `
        --billing-mode PAY_PER_REQUEST `
        --region $Region `
        --no-cli-pager
    Write-Host "✅ Tabela Logs criada" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Tabela Logs já existe ou erro na criação" -ForegroundColor Yellow
}

Write-Host "⏳ Aguardando tabelas ficarem ativas..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "📱 Inserindo artefatos NFC de exemplo..." -ForegroundColor Blue

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

# Sample NFC token 1
$item1 = @"
{
    "tokenId": {"S": "nfc-token-001"},
    "status": {"S": "ATIVO"},
    "dataCriacao": {"N": "$timestamp"},
    "ultimoAcesso": {"N": "0"},
    "ultimoLocalLeitura": {"S": "Genesis 1:1"},
    "tempoTotalLeitura": {"N": "0"},
    "percentualCompleto": {"N": "0"},
    "sessaoAtiva": {"NULL": true},
    "metadata": {"M": {
        "versao": {"S": "1.0"},
        "regiao": {"S": "BR"},
        "tipo": {"S": "NFC_CARD"}
    }}
}
"@

aws dynamodb put-item --table-name "quero-conhecer-jesus-artefatos-$Stage" --item $item1 --region $Region --no-cli-pager

# Sample NFC token 2
$item2 = @"
{
    "tokenId": {"S": "nfc-token-002"},
    "status": {"S": "ATIVO"},
    "dataCriacao": {"N": "$timestamp"},
    "ultimoAcesso": {"N": "0"},
    "ultimoLocalLeitura": {"S": "João 3:16"},
    "tempoTotalLeitura": {"N": "1800"},
    "percentualCompleto": {"N": "5.2"},
    "sessaoAtiva": {"NULL": true},
    "metadata": {"M": {
        "versao": {"S": "1.0"},
        "regiao": {"S": "BR"},
        "tipo": {"S": "NFC_STICKER"}
    }}
}
"@

aws dynamodb put-item --table-name "quero-conhecer-jesus-artefatos-$Stage" --item $item2 --region $Region --no-cli-pager

Write-Host "🔧 Configurando variáveis de ambiente..." -ForegroundColor Blue

# Create .env file for backend
$envContent = @"
AWS_REGION=$Region
ARTEFATOS_TABLE=quero-conhecer-jesus-artefatos-$Stage
LOGS_TABLE=quero-conhecer-jesus-logs-$Stage
JWT_SECRET=$JwtSecret
FRONTEND_URL=https://your-frontend-domain.com
"@

$envContent | Out-File -FilePath "..\backend\.env" -Encoding UTF8

Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Blue
Set-Location "..\backend"
npm install

# Install serverless if not present
if (-not (Get-Command serverless -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Instalando Serverless Framework..." -ForegroundColor Blue
    npm install -g serverless
}

Write-Host "🚀 Fazendo deploy das funções Lambda..." -ForegroundColor Green
serverless deploy --stage $Stage

Write-Host "📋 Obtendo informações do deploy..." -ForegroundColor Blue
$deployInfo = serverless info --stage $Stage
$apiUrl = ($deployInfo | Select-String "ServiceEndpoint:").ToString().Split(' ')[1].Trim()

Write-Host ""
Write-Host "✅ Setup concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Informações importantes:" -ForegroundColor Yellow
Write-Host "  - API Gateway URL: $apiUrl" -ForegroundColor White
Write-Host "  - Tabela Artefatos: quero-conhecer-jesus-artefatos-$Stage" -ForegroundColor White
Write-Host "  - Tabela Logs: quero-conhecer-jesus-logs-$Stage" -ForegroundColor White
Write-Host "  - Região: $Region" -ForegroundColor White
Write-Host ""
Write-Host "🔗 URLs de teste dos artefatos NFC:" -ForegroundColor Cyan
Write-Host "  - Token 1: $apiUrl/auth/nfc-token-001" -ForegroundColor White
Write-Host "  - Token 2: $apiUrl/auth/nfc-token-002" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Configurações de segurança:" -ForegroundColor Yellow
Write-Host "  - JWT Secret foi gerado automaticamente" -ForegroundColor White
Write-Host "  - Cookies são HttpOnly e Secure" -ForegroundColor White
Write-Host "  - Sessões expiram em 2 horas" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "  1. Atualize FRONTEND_URL no arquivo .env com seu domínio real" -ForegroundColor White
Write-Host "  2. Configure CORS adequadamente para produção" -ForegroundColor White
Write-Host "  3. Monitore os logs no CloudWatch" -ForegroundColor White
Write-Host "  4. Palavra-chave secreta: 'emanuel'" -ForegroundColor White

# Save deployment info
$deploymentInfo = @{
    apiGatewayUrl = $apiUrl
    region = $Region
    stage = $Stage
    artefatosTable = "quero-conhecer-jesus-artefatos-$Stage"
    logsTable = "quero-conhecer-jesus-logs-$Stage"
    sampleTokens = @("nfc-token-001", "nfc-token-002")
    secretKeyword = "emanuel"
    deploymentDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

$deploymentInfo | ConvertTo-Json -Depth 3 | Out-File -FilePath "..\deployment-info.json" -Encoding UTF8

Write-Host ""
Write-Host "💾 Informações do deploy salvas em deployment-info.json" -ForegroundColor Green

Set-Location "..\infrastructure"
