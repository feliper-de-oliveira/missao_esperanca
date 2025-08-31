const AWS = require('aws-sdk');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Configure AWS S3
const s3 = new AWS.S3({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Encryption configuration
const ENCRYPTION_KEY = process.env.BIBLE_ENCRYPTION_KEY || 'biblia-segura-chave-32-caracteres!';
const ALGORITHM = 'aes-256-cbc';

// XOR obfuscation
function xorObfuscate(text, key = 'emanuel-key') {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

// Encrypt content
function encryptContent(content) {
    try {
        const obfuscated = xorObfuscate(content);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(obfuscated, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const combined = Buffer.concat([iv, encrypted]);
        return combined.toString('base64');
    } catch (error) {
        throw new Error('Failed to encrypt content');
    }
}

// Download Bible file from S3
async function downloadBibleFromS3() {
    try {
        const params = {
            Bucket: process.env.BIBLE_S3_BUCKET || 'secure-bible-storage',
            Key: process.env.BIBLE_S3_KEY || 'bibles/NT-NVI-Pt.md',
            // Add server-side encryption parameters
            ServerSideEncryption: 'AES256'
        };

        console.log('📡 Downloading Bible from S3...');
        console.log(`Bucket: ${params.Bucket}`);
        console.log(`Key: ${params.Key}`);

        const data = await s3.getObject(params).promise();
        const content = data.Body.toString('utf-8');
        
        console.log(`✅ Downloaded ${content.length} characters from S3`);
        return content;
        
    } catch (error) {
        console.error('❌ S3 Download Error:', error.message);
        throw new Error(`S3 download failed: ${error.message}`);
    }
}

// Main handler for secure Bible download
exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Credentials': true,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
    };

    try {
        // Verify authentication token from path
        const token = event.pathParameters?.token;
        if (token !== 'emanuel-bible-access') {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Invalid access token' })
            };
        }

        // Verify session cookie
        const cookies = event.headers.Cookie || event.headers.cookie || '';
        const sessionMatch = cookies.match(/session=([^;]+)/);
        
        if (!sessionMatch || !sessionMatch[1].startsWith('mock-session-')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized - No valid session' })
            };
        }

        // Download Bible content from S3
        const bibleContent = await downloadBibleFromS3();
        
        // Log access for security audit
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: 'BIBLE_S3_DOWNLOAD',
            sessionId: sessionMatch[1],
            ip: event.requestContext?.identity?.sourceIp || 'unknown',
            userAgent: event.headers['User-Agent'] || 'unknown',
            contentSize: bibleContent.length
        };
        
        console.log('📋 Access Log:', JSON.stringify(logEntry));

        // Return decrypted content directly (no caching)
        return {
            statusCode: 200,
            headers: {
                ...headers,
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY'
            },
            body: bibleContent
        };

    } catch (error) {
        console.error('❌ Handler Error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Content temporarily unavailable',
                timestamp: new Date().toISOString()
            })
        };
    }
};

// Local development function
async function downloadAndEncryptLocally() {
    try {
        console.log('🏠 Local Development Mode - Downloading from S3...');
        
        const content = await downloadBibleFromS3();
        const encrypted = encryptContent(content);
        
        const fs = require('fs');
        const path = require('path');
        
        const outputPath = path.join(__dirname, '..', 'data', 'bible-s3-encrypted.dat');
        fs.writeFileSync(outputPath, encrypted);
        
        console.log('✅ S3 content downloaded and encrypted locally');
        console.log(`📁 Saved to: ${outputPath}`);
        console.log(`📊 Original: ${content.length} chars, Encrypted: ${encrypted.length} chars`);
        
        return { content, encrypted, outputPath };
        
    } catch (error) {
        console.error('❌ Local download failed:', error.message);
        throw error;
    }
}

module.exports = {
    downloadBibleFromS3,
    downloadAndEncryptLocally,
    encryptContent,
    xorObfuscate
};
