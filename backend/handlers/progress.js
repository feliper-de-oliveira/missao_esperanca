const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Credentials': true
    };

    try {
        // Verificar cookie de sessão
        const cookies = event.headers.Cookie || event.headers.cookie || '';
        const sessionMatch = cookies.match(/session=([^;]+)/);
        
        if (!sessionMatch) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Sessão não encontrada' })
            };
        }

        const sessionToken = sessionMatch[1];
        let decoded;
        
        try {
            decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
        } catch (jwtError) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Sessão inválida' })
            };
        }

        const { tokenId, sessionId } = decoded;

        // Verificar se o artefato ainda está válido
        const getParams = {
            TableName: process.env.ARTEFATOS_TABLE,
            Key: { tokenId }
        };

        const result = await dynamodb.get(getParams).promise();
        
        if (!result.Item || result.Item.status === 'COMPROMETIDO' || result.Item.sessaoAtiva !== sessionId) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Acesso negado' })
            };
        }

        // Extrair dados do progresso do body
        const body = JSON.parse(event.body || '{}');
        const { localLeitura, tempoLeitura, percentualCompleto } = body;

        if (!localLeitura) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Local de leitura obrigatório' })
            };
        }

        // Atualizar progresso no DynamoDB
        const updateParams = {
            TableName: process.env.ARTEFATOS_TABLE,
            Key: { tokenId },
            UpdateExpression: 'SET ultimoLocalLeitura = :local, ultimaAtualizacao = :timestamp, tempoTotalLeitura = if_not_exists(tempoTotalLeitura, :zero) + :tempo, percentualCompleto = :percentual',
            ExpressionAttributeValues: {
                ':local': localLeitura,
                ':timestamp': Date.now(),
                ':tempo': tempoLeitura || 0,
                ':zero': 0,
                ':percentual': percentualCompleto || 0
            }
        };

        await dynamodb.update(updateParams).promise();

        // Log de progresso
        const logParams = {
            TableName: process.env.LOGS_TABLE,
            Item: {
                id: uuidv4(),
                timestamp: Date.now(),
                tokenId,
                acao: 'PROGRESS_SAVE',
                dados: {
                    localLeitura,
                    tempoLeitura: tempoLeitura || 0,
                    percentualCompleto: percentualCompleto || 0
                },
                ip: event.requestContext.identity.sourceIp
            }
        };

        await dynamodb.put(logParams).promise();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Progresso salvo com sucesso',
                ultimoLocalLeitura: localLeitura,
                timestamp: Date.now()
            })
        };

    } catch (error) {
        console.error('Erro ao salvar progresso:', error);
        
        // Log de erro
        try {
            const logParams = {
                TableName: process.env.LOGS_TABLE,
                Item: {
                    id: uuidv4(),
                    timestamp: Date.now(),
                    tokenId: 'unknown',
                    acao: 'PROGRESS_ERROR',
                    erro: error.message,
                    ip: event.requestContext.identity.sourceIp
                }
            };
            await dynamodb.put(logParams).promise();
        } catch (logError) {
            console.error('Erro ao registrar log:', logError);
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro interno do servidor' })
        };
    }
};
