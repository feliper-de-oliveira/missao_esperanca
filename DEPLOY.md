# Deploy no Netlify

## Pré-requisitos

1. Conta no Netlify
2. Netlify CLI instalado: `npm install -g netlify-cli`
3. Git inicializado no projeto

## Passos para Deploy

### 1. Preparar o projeto
```bash
# Instalar dependências
npm install

# Inicializar Git (se não feito)
git init
git add .
git commit -m "Initial commit"
```

### 2. Deploy via CLI
```bash
# Login no Netlify
netlify login

# Deploy inicial
netlify deploy

# Deploy para produção
netlify deploy --prod
```

### 3. Configurar Variáveis de Ambiente

No painel do Netlify, adicione:

```
BIBLE_S3_URL=https://meetjesusprd.s3.us-east-1.amazonaws.com/biblia.md
BIBLE_ENCRYPTION_KEY=biblia-segura-chave-32-caracteres!
JWT_SECRET=super-secret-jwt-key-for-sessions-32-chars
NODE_ENV=production
```

### 4. Deploy via Git (Alternativo)

1. Conecte o repositório no painel do Netlify
2. Configure build settings:
   - Build command: `npm install`
   - Publish directory: `frontend`
   - Functions directory: `netlify/functions`

## Estrutura do Deploy

- **Frontend**: Servido estaticamente da pasta `frontend/`
- **API**: Serverless functions em `netlify/functions/`
- **Redirects**: Configurados no `netlify.toml`

## URLs da Aplicação

- **Produção**: `https://seu-site.netlify.app`
- **Autenticação**: `/api/auth/nfc-token-001`
- **Bíblia**: Acesso via palavra-chave "emanuel"

## Funções Serverless

- `auth.mts` - Autenticação NFC
- `s3-bible.mts` - Download da Bíblia
- `progress.mts` - Salvamento de progresso
- `panic.mts` - Botão de pânico

## Segurança

- Headers anti-cache configurados
- Cookies HttpOnly e Secure
- Criptografia de conteúdo
- Sem rastros digitais
