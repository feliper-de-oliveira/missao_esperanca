const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Credentials': true
    };

    try {
        const { tokenId } = event.pathParameters;
        
        // Validar token no DynamoDB
        const params = {
            TableName: process.env.ARTEFATOS_TABLE,
            Key: { tokenId }
        };

        const result = await dynamodb.get(params).promise();
        
        if (!result.Item) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Token não encontrado' })
            };
        }

        const artefato = result.Item;

        // Verificar se o artefato não está comprometido
        if (artefato.status === 'COMPROMETIDO') {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Artefato comprometido' })
            };
        }

        // Gerar cookie de sessão
        const sessionId = uuidv4();
        const sessionToken = jwt.sign(
            { 
                sessionId, 
                tokenId,
                timestamp: Date.now()
            }, 
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        // Atualizar último acesso
        const updateParams = {
            TableName: process.env.ARTEFATOS_TABLE,
            Key: { tokenId },
            UpdateExpression: 'SET ultimoAcesso = :timestamp, sessaoAtiva = :sessao',
            ExpressionAttributeValues: {
                ':timestamp': Date.now(),
                ':sessao': sessionId
            }
        };

        await dynamodb.update(updateParams).promise();

        // Log de acesso
        const logParams = {
            TableName: process.env.LOGS_TABLE,
            Item: {
                id: uuidv4(),
                timestamp: Date.now(),
                tokenId,
                acao: 'AUTH_SUCCESS',
                ip: event.requestContext.identity.sourceIp,
                userAgent: event.headers['User-Agent'] || 'Unknown'
            }
        };

        await dynamodb.put(logParams).promise();

        // Redirecionar para a fachada com cookie
        const redirectUrl = `${process.env.FRONTEND_URL || 'https://your-frontend-domain.com'}`;
        
        return {
            statusCode: 302,
            headers: {
                ...headers,
                'Location': redirectUrl,
                'Set-Cookie': `session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`
            }
        };

    } catch (error) {
        console.error('Erro na autenticação:', error);
        
        // Log de erro
        try {
            const logParams = {
                TableName: process.env.LOGS_TABLE,
                Item: {
                    id: uuidv4(),
                    timestamp: Date.now(),
                    tokenId: event.pathParameters?.tokenId || 'unknown',
                    acao: 'AUTH_ERROR',
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
