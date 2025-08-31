# Quero Conhecer Jesus - Sistema de Distribuição Anônima da Bíblia

## Visão Geral
Sistema digital anônimo e ultrasseguro para distribuição da Bíblia Cristã em regiões de alto risco. Combina artefato físico NFC, aplicação web de fachada (tema Alcorão) e backend serverless AWS.

## Arquitetura

### Backend (AWS Serverless)
- **API Gateway**: Ponto de entrada para requisições HTTP
- **AWS Lambda**: Funções serverless (handleAuth, handleContent, saveProgress, handlePanic)
- **DynamoDB**: Tabelas Artefatos e Logs

### Frontend
- **Fachada**: Site sobre Alcorão (camuflagem)
- **Modal Secreto**: Pop-up para exibição do conteúdo bíblico
- **Cache Local**: Armazenamento completo da Bíblia para acesso offline

## Fluxo de Segurança

1. **Acesso via NFC**: Token único redireciona para handleAuth
2. **Validação**: Cookie de sessão gerado e validado
3. **Ativação**: Palavra-chave secreta na busca ativa o modal
4. **Proteção**: Botão de pânico compromete o artefato permanentemente

## Estrutura do Projeto

```
/
├── frontend/           # Aplicação web
├── backend/           # Funções Lambda
├── infrastructure/    # Scripts AWS
├── docs/             # Documentação
└── config/           # Configurações
```

## Instalação e Deploy

1. Configure as credenciais AWS
2. Execute os scripts de infraestrutura
3. Deploy das funções Lambda
4. Configuração do frontend

## Segurança

- Autenticação via NFC obrigatória
- Cookies de sessão com expiração
- Logs de acesso para auditoria
- Sistema de pânico para comprometimento
