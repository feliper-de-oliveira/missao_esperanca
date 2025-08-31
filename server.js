// Load environment variables first
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

// S3 functions removed - using local files only

// Get Bible S3 URL from environment
const BIBLE_S3_URL = process.env.BIBLE_S3_URL || 'https://hackathon-conteudo-publico.s3.us-east-1.amazonaws.com/biblia.md';
console.log('📡 Bible S3 URL configured:', BIBLE_S3_URL);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://your-api-gateway-url.amazonaws.com"]
        }
    }
}));

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/backend', express.static(path.join(__dirname, 'backend')));

// Mock API endpoints for local testing
app.get('/api/auth/:tokenId', (req, res) => {
    const { tokenId } = req.params;
    
    // Mock validation - in production this would be AWS Lambda
    const validTokens = ['nfc-token-001', 'nfc-token-002'];
    
    if (!validTokens.includes(tokenId)) {
        return res.status(404).json({ error: 'Token não encontrado' });
    }
    
    // Generate mock session cookie
    const sessionToken = 'mock-session-' + Date.now();
    
    res.cookie('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 2 * 60 * 60 * 1000 // 2 hours
    });
    
    res.redirect('/');
});

// Secure endpoint for Bible content access
app.get('/api/bible-access/:token', (req, res) => {
    const { token } = req.params;
    const sessionCookie = req.cookies.session;
    
    // Verify session and token
    if (!sessionCookie || !sessionCookie.startsWith('mock-session-')) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }
    
    if (token !== 'emanuel-access') {
        return res.status(403).json({ error: 'Invalid access token' });
    }
    
    // Set secure headers to prevent caching
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
    });
    
    res.json({
        success: true,
        access: 'granted',
        timestamp: Date.now()
    });
});

app.post('/api/progress', (req, res) => {
    const { localLeitura, tempoLeitura, percentualCompleto } = req.body;
    const sessionCookie = req.cookies.session;
    
    if (!sessionCookie || !sessionCookie.startsWith('mock-session-')) {
        return res.status(401).json({ error: 'Sessão não encontrada' });
    }
    
    // Mock progress save
    console.log('Progress saved:', { localLeitura, tempoLeitura, percentualCompleto });
    
    res.json({
        success: true,
        message: 'Progresso salvo com sucesso',
        ultimoLocalLeitura: localLeitura,
        timestamp: Date.now()
    });
});

app.post('/api/panic', (req, res) => {
    const sessionCookie = req.cookies.session;
    
    if (!sessionCookie || !sessionCookie.startsWith('mock-session-')) {
        return res.status(401).json({ error: 'Sessão não encontrada' });
    }
    
    // Mock panic button - clear session
    res.clearCookie('session');
    
    console.log('PANIC BUTTON ACTIVATED - Session terminated');
    
    res.json({
        success: true,
        message: 'Artefato comprometido com sucesso',
        status: 'COMPROMETIDO',
        timestamp: Date.now()
    });
});

// Encryption configuration from environment
const ENCRYPTION_KEY = process.env.BIBLE_ENCRYPTION_KEY || 'biblia-segura-chave-32-caracteres!';
const ALGORITHM = 'aes-256-cbc';

// XOR obfuscation function
function xorObfuscate(text, key = 'emanuel-key') {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

// Decrypt content function
function decryptBibleContent(encryptedData) {
    try {
        const buffer = Buffer.from(encryptedData, 'base64');
        const iv = buffer.slice(0, 16);
        const encrypted = buffer.slice(16);
        
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encrypted, null, 'utf8');
        decrypted += decipher.final('utf8');
        
        return xorObfuscate(decrypted);
    } catch (error) {
        throw new Error('Failed to decrypt content');
    }
}

// S3 Bible download endpoint
app.get('/api/s3-bible/:token', async (req, res) => {
    const { token } = req.params;
    const sessionCookie = req.cookies.session;
    
    // Verify session and secret token
    if (!sessionCookie || !sessionCookie.startsWith('mock-session-')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (token !== 'emanuel-bible-access') {
        return res.status(403).json({ error: 'Invalid token' });
    }
    
    // Set anti-caching and security headers
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Content-Type': 'text/plain; charset=utf-8'
    });
    
    try {
        console.log('📡 Attempting direct S3 Bible download...');
        
        // Download from S3 URL
        const https = require('https');
        const bibleContent = await new Promise((resolve, reject) => {
            https.get(BIBLE_S3_URL, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }
                
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => resolve(data));
                response.on('error', reject);
            }).on('error', reject);
        });
        
        // Log successful S3 download
        console.log('✅ S3 Bible download successful', {
            sessionId: sessionCookie,
            contentLength: bibleContent.length,
            timestamp: new Date().toISOString()
        });
        
        res.send(bibleContent);
        
    } catch (s3Error) {
        console.log('⚠️ S3 download failed, trying local fallback:', s3Error.message);
        
        try {
            // Fallback to local encrypted file
            const encryptedPath = path.join(__dirname, 'backend/data/bible-encrypted.dat');
            
            if (fs.existsSync(encryptedPath)) {
                const encryptedContent = fs.readFileSync(encryptedPath, 'utf8');
                const decryptedContent = decryptBibleContent(encryptedContent);
                
                console.log('✅ Local encrypted fallback successful');
                res.send(decryptedContent);
            } else {
                // Final fallback to original file
                const originalPath = path.join(__dirname, 'backend/data/NT-NVI-Pt.md');
                const content = fs.readFileSync(originalPath, 'utf8');
                
                console.log('✅ Local original fallback successful');
                res.send(content);
            }
        } catch (localError) {
            console.error('❌ All download methods failed, using minimal fallback');
            
            // Minimal Bible content fallback to prevent 500 errors
            const fallbackContent = `# Bíblia Sagrada

## João 3:16

**16** Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.

## 1 João 4:8

**8** Aquele que não ama não conhece a Deus, porque Deus é amor.

## Salmos 23:1

**1** O Senhor é o meu pastor; nada me faltará.

---
*Conteúdo limitado - verifique conexão*`;
            
            console.log('✅ Minimal fallback content served');
            res.send(fallbackContent);
        }
    }
});

// Generate presigned S3 URL endpoint
app.get('/api/s3-presigned/:token', async (req, res) => {
    const { token } = req.params;
    const sessionCookie = req.cookies.session;
    
    // Verify session and secret token
    if (!sessionCookie || !sessionCookie.startsWith('mock-session-')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (token !== 'emanuel-presigned-access') {
        return res.status(403).json({ error: 'Invalid token' });
    }
    
    try {
        // Return the direct S3 URL (no presigning needed for public URLs)
        res.json({
            success: true,
            downloadUrl: BIBLE_S3_URL,
            expires: 0, // Direct URL doesn't expire
            timestamp: new Date().toISOString(),
            note: 'Direct S3 URL - no expiration'
        });
        
    } catch (error) {
        console.error('❌ Failed to generate presigned URL:', error);
        res.status(500).json({ 
            error: 'Unable to generate download link',
            details: error.message
        });
    }
});

// Legacy secure content endpoint (local only)
app.get('/api/secure-content/:token', (req, res) => {
    const { token } = req.params;
    const sessionCookie = req.cookies.session;
    
    // Verify session and secret token
    if (!sessionCookie || !sessionCookie.startsWith('mock-session-')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (token !== 'emanuel-bible-access') {
        return res.status(403).json({ error: 'Invalid token' });
    }
    
    // Set anti-caching and security headers
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Content-Type': 'text/plain; charset=utf-8'
    });
    
    try {
        // Try to read encrypted file first
        const encryptedPath = path.join(__dirname, 'backend/data/bible-encrypted.dat');
        
        if (fs.existsSync(encryptedPath)) {
            const encryptedContent = fs.readFileSync(encryptedPath, 'utf8');
            const decryptedContent = decryptBibleContent(encryptedContent);
            res.send(decryptedContent);
        } else {
            // Fallback to original file if encrypted doesn't exist
            const originalPath = path.join(__dirname, 'backend/data/NT-NVI-Pt.md');
            const content = fs.readFileSync(originalPath, 'utf8');
            res.send(content);
        }
    } catch (error) {
        console.error('Error serving Bible content:', error);
        res.status(500).send('Content unavailable');
    }
});

// Legacy endpoint redirect (hide the real path)
app.get('/backend/data/NT-NVI-Pt.md', (req, res) => {
    // Redirect to secure endpoint to hide real file structure
    res.status(404).send('Not found');
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📱 URLs de teste NFC:`);
    console.log(`   - http://localhost:${PORT}/api/auth/nfc-token-001`);
    console.log(`   - http://localhost:${PORT}/api/auth/nfc-token-002`);
    console.log(`🔐 Palavra-chave secreta: "emanuel"`);
    console.log(`⚠️  Botão de pânico: Ctrl+Shift+P ou botão X no modal`);
});
