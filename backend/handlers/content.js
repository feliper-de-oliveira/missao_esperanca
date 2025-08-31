const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Encryption configuration
const ENCRYPTION_KEY = process.env.BIBLE_ENCRYPTION_KEY || 'biblia-segura-chave-32-caracteres!';
const ALGORITHM = 'aes-256-cbc';

// Simple XOR obfuscation for additional layer
function xorObfuscate(text, key = 'emanuel-key') {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

// Decrypt and deobfuscate content
function decryptBibleContent(encryptedData) {
    try {
        // First layer: Base64 decode
        const buffer = Buffer.from(encryptedData, 'base64');
        
        // Extract IV (first 16 bytes)
        const iv = buffer.slice(0, 16);
        const encrypted = buffer.slice(16);
        
        // Decrypt with AES
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encrypted, null, 'utf8');
        decrypted += decipher.final('utf8');
        
        // Second layer: XOR deobfuscation
        const content = xorObfuscate(decrypted);
        
        return content;
    } catch (error) {
        throw new Error('Failed to decrypt content');
    }
}

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
        const params = {
            TableName: process.env.ARTEFATOS_TABLE,
            Key: { tokenId }
        };

        const result = await dynamodb.get(params).promise();
        
        if (!result.Item || result.Item.status === 'COMPROMETIDO' || result.Item.sessaoAtiva !== sessionId) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Acesso negado' })
            };
        }

        // Verificar palavra-chave secreta no body
        const body = JSON.parse(event.body || '{}');
        const { keyword } = body;

        if (keyword !== 'emanuel') { // Palavra-chave secreta
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Palavra-chave incorreta' })
            };
        }

        // Buscar conteúdo da Bíblia (simulado - em produção seria do DynamoDB)
        const bibliaContent = await getBibliaContent();

        // Log de acesso ao conteúdo
        const logParams = {
            TableName: process.env.LOGS_TABLE,
            Item: {
                id: uuidv4(),
                timestamp: Date.now(),
                tokenId,
                acao: 'CONTENT_ACCESS',
                ip: event.requestContext.identity.sourceIp,
                userAgent: event.headers['User-Agent'] || 'Unknown'
            }
        };

        await dynamodb.put(logParams).promise();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                content: bibliaContent,
                ultimoLocalLeitura: result.Item.ultimoLocalLeitura || 'Genesis 1:1'
            })
        };

    } catch (error) {
        console.error('Erro ao buscar conteúdo:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro interno do servidor' })
        };
    }
};

// Função para buscar conteúdo da Bíblia
async function getBibliaContent() {
    // Em produção, isso buscaria do DynamoDB ou S3
    // Por agora, retornamos conteúdo simulado em Markdown
    return {
        livros: [
            {
                nome: "Gênesis",
                capitulos: [
                    {
                        numero: 1,
                        versiculos: [
                            "No princípio, Deus criou os céus e a terra.",
                            "A terra estava sem forma e vazia; havia trevas sobre a face do abismo, e o Espírito de Deus pairava sobre as águas.",
                            "Disse Deus: 'Haja luz!' E houve luz."
                        ]
                    }
                ]
            },
            {
                nome: "João",
                capitulos: [
                    {
                        numero: 3,
                        versiculos: [
                            "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna."
                        ]
                    }
                ]
            }
        ],
        metadata: {
            versao: "Almeida Revista e Atualizada",
            totalLivros: 66,
            totalCapitulos: 1189,
            totalVersiculos: 31102
        }
    };
}
