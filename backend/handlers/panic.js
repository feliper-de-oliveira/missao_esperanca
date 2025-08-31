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

        // COMPROMETER ARTEFATO PERMANENTEMENTE
        const updateParams = {
            TableName: process.env.ARTEFATOS_TABLE,
            Key: { tokenId },
            UpdateExpression: 'SET #status = :status, dataComprometimento = :timestamp, sessaoAtiva = :null, motivoComprometimento = :motivo',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'COMPROMETIDO',
                ':timestamp': Date.now(),
                ':null': null,
                ':motivo': 'PANIC_BUTTON'
            }
        };

        await dynamodb.update(updateParams).promise();

        // Log crítico de comprometimento
        const logParams = {
            TableName: process.env.LOGS_TABLE,
            Item: {
                id: uuidv4(),
                timestamp: Date.now(),
                tokenId,
                acao: 'PANIC_ACTIVATED',
                criticidade: 'ALTA',
                dados: {
                    sessionId,
                    motivoComprometimento: 'PANIC_BUTTON',
                    timestampComprometimento: Date.now()
                },
                ip: event.requestContext.identity.sourceIp,
                userAgent: event.headers['User-Agent'] || 'Unknown'
            }
        };

        await dynamodb.put(logParams).promise();

        // Invalidar cookie imediatamente
        return {
            statusCode: 200,
            headers: {
                ...headers,
                'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
            },
            body: JSON.stringify({
                success: true,
                message: 'Artefato comprometido com sucesso',
                status: 'COMPROMETIDO',
                timestamp: Date.now()
            })
        };

    } catch (error) {
        console.error('Erro no botão de pânico:', error);
        
        // Log de erro crítico
        try {
            const logParams = {
                TableName: process.env.LOGS_TABLE,
                Item: {
                    id: uuidv4(),
                    timestamp: Date.now(),
                    tokenId: 'unknown',
                    acao: 'PANIC_ERROR',
                    criticidade: 'ALTA',
                    erro: error.message,
                    ip: event.requestContext.identity.sourceIp
                }
            };
            await dynamodb.put(logParams).promise();
        } catch (logError) {
            console.error('Erro ao registrar log crítico:', logError);
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro interno do servidor' })
        };
    }
};
