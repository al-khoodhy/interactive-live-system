// realtime-engine/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { WebcastPushConnection } = require('tiktok-live-connector'); 
const LiveEngine = require('./services/LiveEngine');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const engine = new LiveEngine(io);
let tiktokConnection = null; 

// === 1. MANAJEMEN SOCKET LAYAR 2 ===
io.on('connection', (socket) => {
    console.log(`[Socket] Klien Terhubung: ${socket.id}`);
    
    socket.on('player_ready', async (payload) => {
        console.log(`[Socket] React Player Siap. ID Profil: ${payload?.projectId}`);
        await engine.startActiveProject(payload?.projectId);
    });
    
    socket.on('video_ended', async (payload) => {
        await engine.handleVideoEnded(payload);
    });
});

// === 2. API: LABORATORIUM PENGUJIAN (PREVIEW/MOCK) ===
app.post('/api/test-comment', async (req, res) => {
    const { username, text } = req.body;
    console.log(`[Mock Preview] Suntikan Komentar: @${username} -> "${text}"`);
    await engine.handleIncomingComment(username, text);
    res.json({ message: 'Komentar simulasi berhasil dikirim ke Mesin AI.' });
});

app.post('/api/force-next', async (req, res) => {
    const result = await engine.forceNextSequence();
    if (result.success) res.json({ message: result.message });
    else res.status(400).json({ error: result.message });
});

// === API: PENGATURAN MESIN OTOMATISASI ===
app.post('/api/engine/settings', (req, res) => {
    const { maxResponsesPerUser } = req.body;
    if (maxResponsesPerUser !== undefined) {
        engine.maxResponsesPerUser = parseInt(maxResponsesPerUser);
        console.log(`[Engine] Pengaturan Batas Balasan diubah menjadi: ${engine.maxResponsesPerUser}x per penonton.`);
    }
    res.json({ message: 'Pengaturan mesin berhasil diperbarui.' });
});

// === 3. API: INTEGRASI TIKTOK LIVE ===
app.post('/api/tiktok/connect', async (req, res) => {
    // 1. Menerima apiKey dari Frontend (bukan lagi sessionId)
    const { tiktokUsername, apiKey } = req.body;
    
    if (!tiktokUsername) return res.status(400).json({ error: 'Username TikTok wajib diisi.' });

    if (tiktokConnection) {
        tiktokConnection.disconnect();
        tiktokConnection = null;
    }

    console.log(`[TikTok] Mencoba menginisiasi koneksi ke Live Room: @${tiktokUsername}`);
    
    try {
        let connectionOptions = {
            enableExtendedGiftInfo: true
        };

        // 2. MENGGUNAKAN EULERSTREAM API KEY
        if (apiKey && apiKey.trim() !== '') {
            // Ini adalah parameter resmi dari library untuk menggunakan EulerStream
            connectionOptions.apiKey = apiKey.trim(); 
            console.log(`[TikTok] Menggunakan EulerStream API Key untuk bypass Rate Limit.`);
        }

        tiktokConnection = new WebcastPushConnection(tiktokUsername, connectionOptions);

        const state = await tiktokConnection.connect();
        
        console.log(`[TikTok] Berhasil terhubung ke Room ID: ${state.roomId}`);
        io.emit('tiktok_status', { status: 'connected', username: tiktokUsername });
        
        // 3. MENANGKAP KOMENTAR
        tiktokConnection.on('chat', data => {
            // Menyerahkan komentar murni ke Mesin AI kita
            engine.handleIncomingComment(data.uniqueId, data.comment);
        });

        tiktokConnection.on('streamEnd', () => {
            console.log('[TikTok] Sesi Live Stream Berakhir dari server.');
            io.emit('tiktok_status', { status: 'disconnected', message: 'Sesi Live telah berakhir.' });
            if (tiktokConnection) {
                tiktokConnection.disconnect();
                tiktokConnection = null;
            }
        });

        tiktokConnection.on('error', err => {
            console.error('[TikTok] Kesalahan Jaringan Tertangkap:', err);
        });

        return res.json({ message: `Berhasil terhubung ke Live @${tiktokUsername}` });

    } catch (err) {
        console.error('[TikTok] Penolakan Akses:', err.message);
        tiktokConnection = null;
        
        let errorMessage = err.message;
        let statusCode = 500;

        if (errorMessage.includes('not currently live') || errorMessage.includes('LIVE_NOT_FOUND')) {
            errorMessage = `Akun @${tiktokUsername} sedang tidak Live. Anda WAJIB memulai Live terlebih dahulu.`;
            statusCode = 404;
        } else if (errorMessage.includes('Rate Limited') || errorMessage.includes('eulerstream')) {
            errorMessage = `Koneksi anonim ditolak (Rate Limit). WAJIB MENGISI EULERSTREAM API KEY.`;
            statusCode = 429;
        } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('API key')) {
            errorMessage = `EulerStream API Key yang Anda masukkan tidak valid.`;
            statusCode = 401;
        }

        io.emit('tiktok_status', { status: 'error', message: errorMessage });
        return res.status(statusCode).json({ error: errorMessage });
    }
});

app.post('/api/tiktok/disconnect', (req, res) => {
    if (tiktokConnection) {
        tiktokConnection.disconnect();
        tiktokConnection = null;
        io.emit('tiktok_status', { status: 'disconnected', message: 'Koneksi diputus secara manual.' });
    }
    res.json({ message: 'Koneksi TikTok berhasil diputus.' });
});

app.post('/api/tiktok/disconnect', (req, res) => {
    if (tiktokConnection) {
        tiktokConnection.disconnect();
        tiktokConnection = null;
        io.emit('tiktok_status', { status: 'disconnected', message: 'Koneksi diputus secara manual.' });
    }
    res.json({ message: 'Koneksi TikTok berhasil diputus.' });
});

// === 4. START SERVER ===
server.listen(3000, () => {
    console.log('[Server] Real-time Engine & TikTok Connector aktif di Port 3000');
});