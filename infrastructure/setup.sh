#!/bin/bash

# AWS Infrastructure Setup Script for "Quero Conhecer Jesus"
# This script sets up the complete serverless infrastructure

set -e

echo "🚀 Iniciando setup da infraestrutura AWS..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI não encontrado. Por favor, instale o AWS CLI primeiro."
    exit 1
fi

# Check if Serverless Framework is installed
if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless Framework não encontrado. Instalando..."
    npm install -g serverless
fi

# Set environment variables
export AWS_REGION=${AWS_REGION:-us-east-1}
export STAGE=${STAGE:-dev}
export JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 32)}

echo "📋 Configurações:"
echo "  - Região AWS: $AWS_REGION"
echo "  - Stage: $STAGE"
echo "  - JWT Secret: [HIDDEN]"

# Create DynamoDB tables with sample data
echo "📊 Criando tabelas DynamoDB..."

# Create Artefatos table
aws dynamodb create-table \
    --table-name "quero-conhecer-jesus-artefatos-$STAGE" \
    --attribute-definitions \
        AttributeName=tokenId,AttributeType=S \
    --key-schema \
        AttributeName=tokenId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION \
    --no-cli-pager || echo "Tabela Artefatos já existe ou erro na criação"

# Create Logs table
aws dynamodb create-table \
    --table-name "quero-conhecer-jesus-logs-$STAGE" \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=timestamp,AttributeType=N \
    --key-schema \
        AttributeName=id,KeyType=HASH \
        AttributeName=timestamp,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION \
    --no-cli-pager || echo "Tabela Logs já existe ou erro na criação"

echo "⏳ Aguardando tabelas ficarem ativas..."
sleep 10

# Insert sample NFC artifacts
echo "📱 Inserindo artefatos NFC de exemplo..."

# Sample NFC token 1
aws dynamodb put-item \
    --table-name "quero-conhecer-jesus-artefatos-$STAGE" \
    --item '{
        "tokenId": {"S": "nfc-token-001"},
        "status": {"S": "ATIVO"},
        "dataCriacao": {"N": "'$(date +%s)'000"},
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
    }' \
    --region $AWS_REGION \
    --no-cli-pager

# Sample NFC token 2
aws dynamodb put-item \
    --table-name "quero-conhecer-jesus-artefatos-$STAGE" \
    --item '{
        "tokenId": {"S": "nfc-token-002"},
        "status": {"S": "ATIVO"},
        "dataCriacao": {"N": "'$(date +%s)'000"},
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
    }' \
    --region $AWS_REGION \
    --no-cli-pager

echo "🔧 Configurando variáveis de ambiente..."

# Create .env file for local development
cat > ../backend/.env << EOF
AWS_REGION=$AWS_REGION
ARTEFATOS_TABLE=quero-conhecer-jesus-artefatos-$STAGE
LOGS_TABLE=quero-conhecer-jesus-logs-$STAGE
JWT_SECRET=$JWT_SECRET
FRONTEND_URL=https://your-frontend-domain.com
EOF

echo "📦 Instalando dependências do backend..."
cd ../backend
npm install

echo "🚀 Fazendo deploy das funções Lambda..."
serverless deploy --stage $STAGE

echo "📋 Obtendo informações do deploy..."
API_GATEWAY_URL=$(serverless info --stage $STAGE | grep "ServiceEndpoint:" | cut -d' ' -f2)

echo ""
echo "✅ Setup concluído com sucesso!"
echo ""
echo "📋 Informações importantes:"
echo "  - API Gateway URL: $API_GATEWAY_URL"
echo "  - Tabela Artefatos: quero-conhecer-jesus-artefatos-$STAGE"
echo "  - Tabela Logs: quero-conhecer-jesus-logs-$STAGE"
echo "  - Região: $AWS_REGION"
echo ""
echo "🔗 URLs de teste dos artefatos NFC:"
echo "  - Token 1: $API_GATEWAY_URL/auth/nfc-token-001"
echo "  - Token 2: $API_GATEWAY_URL/auth/nfc-token-002"
echo ""
echo "🔐 Configurações de segurança:"
echo "  - JWT Secret foi gerado automaticamente"
echo "  - Cookies são HttpOnly e Secure"
echo "  - Sessões expiram em 2 horas"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  1. Atualize FRONTEND_URL no arquivo .env com seu domínio real"
echo "  2. Configure CORS adequadamente para produção"
echo "  3. Monitore os logs no CloudWatch"
echo "  4. Palavra-chave secreta: 'emanuel'"
echo ""

# Save deployment info
cat > ../deployment-info.json << EOF
{
  "apiGatewayUrl": "$API_GATEWAY_URL",
  "region": "$AWS_REGION",
  "stage": "$STAGE",
  "artefatosTable": "quero-conhecer-jesus-artefatos-$STAGE",
  "logsTable": "quero-conhecer-jesus-logs-$STAGE",
  "sampleTokens": [
    "nfc-token-001",
    "nfc-token-002"
  ],
  "secretKeyword": "emanuel",
  "deploymentDate": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}
EOF

echo "💾 Informações do deploy salvas em deployment-info.json"
